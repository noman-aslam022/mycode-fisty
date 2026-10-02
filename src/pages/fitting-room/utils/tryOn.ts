import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { OutfitEntry, OutfitSlot } from "../types";
import type { StudioGarment, WardrobeCategory } from "./wardrobe";
import { fetchImageAsDataUrl } from "./image";
import {
  accessoryKind,
  analyzePersonPhoto,
  compositeTryOnResult,
  generateOutfitMask,
  loadImage,
  type PoseReference,
} from "./masking";
import { extractGarmentReference } from "./garmentExtract";
import { batchInstruction, batchLook, entryName } from "./outfit";

/**
 * Fitting engine.
 *
 *  "ai"     — the Bria virtual try-on edge function renders the look, and only
 *             the clothing region of that render is blended back onto the
 *             original photo (face, pose and background stay untouched).
 *  "studio" — no backend available (function not deployed, no key, quota spent,
 *             service down): the selected pieces are still composed onto the
 *             photo locally, inside the same body mask, so the shopper always
 *             sees their look applied instead of an unchanged picture.
 */
export type FitEngine = "ai" | "studio";

export type FitErrorCode =
  | "no_photo"
  | "no_pieces"
  | "service_unavailable"
  | "quota"
  | "no_body"
  | "no_image"
  | "unreadable_garment"
  | "unknown";

export class FitError extends Error {
  code: FitErrorCode;

  constructor(code: FitErrorCode, message: string) {
    super(message);
    this.name = "FitError";
    this.code = code;
  }
}

export interface FitResult {
  image: string;
  engine: FitEngine;
  /** How many pieces were layered on. */
  passes: number;
  /** Why the local studio engine was used, when it was. */
  note: string;
}

export interface FitRequest {
  photo: string;
  garments: StudioGarment[];
  /** Reuse a body reading from an earlier fit instead of re-detecting it. */
  poseRef?: PoseReference | null;
  onProgress?: (message: string) => void;
  /** Hand back the body reading so the next fit can skip the detection cost. */
  onPose?: (pose: PoseReference) => void;
}

/** Each studio rail maps onto the fitting slot the engines understand. */
const SLOT_FOR_RAIL: Record<WardrobeCategory, OutfitSlot> = {
  torso: "top",
  pants: "bottom",
  jackets: "layer",
  // Shoes and accessories both go in as accessories: the mask decides which
  // part of the body (feet, head, hands, hip) each one is allowed to touch.
  footwear: "accessory",
  accessories: "accessory",
};

/** Painted back-to-front so a jacket lands on top of the shirt under it. */
const PAINT_ORDER: OutfitSlot[] = ["bottom", "top", "layer", "accessory"];

export const entriesOf = (garments: StudioGarment[]): OutfitEntry[] =>
  garments.map((garment) => ({
    kind: "catalog" as const,
    id: garment.id,
    slot: SLOT_FOR_RAIL[garment.category],
    product: garment.product,
    color: garment.colors[0] ?? "#3a3a34",
  }));

/**
 * Downloads a catalog photo so its pixels become readable by the canvas.
 */
const inlineSource = async (src: string, label: string): Promise<string> => {
  if (src.startsWith("data:")) return src;
  try {
    return await fetchImageAsDataUrl(src);
  } catch {
    throw new FitError(
      "unreadable_garment",
      `We couldn't load the photo of ${label}. Try a different piece.`
    );
  }
};

/**
 * The image the engine should actually see: the human-free cut-out built at
 * upload time when we have one, otherwise the product photo itself.
 *
 * The result is always an inline data URL. Catalog photos live on a remote host,
 * and drawing one of those straight onto a canvas taints it — the browser then
 * refuses to hand back the finished look — so every source is downloaded and
 * inlined before the engines ever touch it.
 */
const garmentReference = async (entry: OutfitEntry): Promise<string> => {
  if (entry.kind !== "catalog") return inlineSource(entry.garment.source, entryName(entry));
  const product = entry.product;
  if (product.garmentRef) return product.garmentRef;
  // A flat product shot has no model in it, so extraction would only hand the
  // same image back — skip the detector entirely.
  if (!product.onModel) return inlineSource(product.image, entryName(entry));
  return extractGarmentReference(product.image, entry.slot, { onModel: true });
};

const readServiceError = async (raw: unknown): Promise<FitError> => {
  const resolved = raw instanceof Promise ? await raw : raw;
  const message =
    typeof resolved === "string"
      ? resolved
      : resolved instanceof Error
        ? resolved.message
        : "The try-on service failed.";
  const text = message.toLowerCase();

  if (text.includes("free_limit_reached") || text.includes("quota")) {
    return new FitError(
      "quota",
      "The try-on service has used up its free quota. Add credits or update BRIA_API_KEY in Supabase."
    );
  }
  if (
    text.includes("requested path is invalid") ||
    text.includes("function not found") ||
    text.includes("failed to fetch") ||
    text.includes("networkerror") ||
    text.includes("load failed") ||
    text.includes("is not a function")
  ) {
    return new FitError(
      "service_unavailable",
      "The AI try-on service isn't reachable right now."
    );
  }
  return new FitError("unknown", message);
};

const fitWithAi = async (
  photo: string,
  pose: PoseReference | null,
  groups: OutfitEntry[][],
  refs: Map<string, string>,
  report: (message: string) => void
): Promise<FitResult> => {
  if (!isSupabaseConfigured) {
    throw new FitError(
      "service_unavailable",
      "Try-on isn't connected. Add VITE_PUBLIC_SUPABASE_URL and VITE_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  // Checked before the first call: without a body reading there is no mask to
  // send, and a render we could not blend back would be spent quota for nothing.
  if (!pose) {
    throw new FitError(
      "no_body",
      "We could not read the body in your photo. Try a clear, full-body photo."
    );
  }

  let composed = photo;
  let passes = 0;

  for (const [index, group] of groups.entries()) {
    const wearable = group.filter((entry) => refs.has(entry.id));
    if (wearable.length === 0) continue;

    report(
      groups.length > 1
        ? `Pass ${index + 1} of ${groups.length} — fitting ${wearable.length} ${
            wearable.length === 1 ? "piece" : "pieces"
          }…`
        : "Fitting your look…"
    );
    passes += 1;

    // The same mask does double duty: it goes to the model as the region it is
    // allowed to repaint (so the face is never regenerated at all), and it is
    // reused below to blend the result back onto the untouched photo.
    const mask = await generateOutfitMask(pose, wearable);
    if (!mask) {
      throw new FitError(
        "no_body",
        "We could not lock your face and body for this fit. Try again."
      );
    }

    const garmentImages = wearable.map((entry) => refs.get(entry.id) as string);
    const { data, error } = await supabase.functions.invoke("bria-tryon", {
      body: {
        personImage: composed,
        garmentImages,
        maskImage: mask,
        instruction: batchInstruction(wearable),
      },
    });

    if (error) throw await readServiceError(await unwrapFunctionError(error));

    const payload = data as
      | { imageUrl?: string; imageDataUrl?: string; error?: string }
      | null
      | undefined;
    if (payload?.error) throw await readServiceError(payload.error);

    // The blend below has to read pixels, and a cross-origin image the browser
    // refuses to expose would silently fall back to the raw AI frame — so the
    // render is always inlined as a data URL first.
    let generated = payload?.imageDataUrl ?? "";
    if (!generated && payload?.imageUrl) {
      try {
        generated = await fetchImageAsDataUrl(payload.imageUrl);
      } catch {
        generated = "";
      }
    }
    if (!generated) {
      throw new FitError("no_image", "No image came back from the try-on service.");
    }

    try {
      composed = await compositeTryOnResult(composed, generated, mask);
    } catch (err) {
      throw new FitError(
        "unknown",
        err instanceof Error
          ? err.message
          : "We could not blend the fit onto your photo. Try again."
      );
    }
  }

  if (passes === 0) {
    throw new FitError("unreadable_garment", "None of these pieces could be read.");
  }

  return { image: composed, engine: "ai", passes, note: "" };
};

const unwrapFunctionError = (error: unknown): unknown => {
  const context = (error as { context?: Response } | null)?.context;
  if (context && typeof (context as Response).json === "function") {
    return (context as Response)
      .clone()
      .json()
      .then((body: { error?: string } | null) => body?.error ?? error)
      .catch(() => error);
  }
  return error;
};

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Reads a body mask and turns its white "edit" area into an alpha channel plus
 * the bounding box the garment should occupy.
 */
const readMaskRegion = async (
  maskDataUrl: string,
  width: number,
  height: number
): Promise<{ alpha: HTMLCanvasElement; box: Box } | null> => {
  const maskImg = await loadImage(maskDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(maskImg, 0, 0, width, height);
  const frame = ctx.getImageData(0, 0, width, height);
  const { data } = frame;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let i = 0; i < data.length; i += 4) {
    const luminance = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i + 3] = luminance;
    if (luminance <= 40) continue;
    const pixel = i / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  if (maxX < 0) return null;
  ctx.putImageData(frame, 0, 0);
  return {
    alpha: canvas,
    box: { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
  };
};

/** How a garment image is placed into its body region. */
const fitBox = (art: PieceArt, box: Box, mode: "fill" | "cover" | "contain"): Box => {
  const { width: iw, height: ih } = pixelsOf(art);
  const insetX = box.width * 0.02;
  const insetY = box.height * 0.02;
  const bw = Math.max(box.width - insetX * 2, 1);
  const bh = Math.max(box.height - insetY * 2, 1);

  if (mode === "fill" || !iw || !ih) {
    return {
      x: box.x + box.width / 2 - bw / 2,
      y: box.y + box.height / 2 - bh / 2,
      width: bw,
      height: bh,
    };
  }

  const scale =
    mode === "cover" ? Math.max(bw / iw, bh / ih) : Math.min(bw / iw, bh / ih);
  const width = iw * scale;
  const height = ih * scale;
  return {
    x: box.x + box.width / 2 - width / 2,
    y: box.y + box.height / 2 - height / 2,
    width,
    height,
  };
};

/** How far a pixel may drift from the backdrop before it counts as garment. */
const BACKDROP_TOLERANCE = 44;

/**
 * Removes a plain studio backdrop from a product photo.
 *
 * Catalog shots are photographed on a flat sweep, so without this the local
 * engine would clip that rectangle straight onto the shopper's chest. Only
 * pixels reachable from the image border are removed, which keeps a garment
 * that happens to share the backdrop colour inside it, and the result is
 * discarded unless it removed a believable amount — a failed knock-out is
 * better than a mangled product.
 */
const knockOutBackdrop = (img: HTMLImageElement): HTMLImageElement | HTMLCanvasElement => {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (!width || !height) return img;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return img;
  ctx.drawImage(img, 0, 0, width, height);

  let frame: ImageData;
  try {
    frame = ctx.getImageData(0, 0, width, height);
  } catch {
    return img;
  }

  const { data } = frame;
  const total = width * height;

  // Backdrop colour = per-channel median of a 2px band around the edges.
  const samples: number[][] = [[], [], []];
  const edge = Math.max(1, Math.min(2, Math.floor(Math.min(width, height) / 32)));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const onEdge = x < edge || y < edge || x >= width - edge || y >= height - edge;
      if (!onEdge) continue;
      const i = (y * width + x) * 4;
      samples[0].push(data[i]);
      samples[1].push(data[i + 1]);
      samples[2].push(data[i + 2]);
    }
  }
  const backdrop = samples.map((channel) => channel.sort((a, b) => a - b)[channel.length >> 1]);
  if (backdrop.some((value) => value === undefined)) return img;

  const isBackdrop = (pixel: number): boolean => {
    const i = pixel * 4;
    const dr = data[i] - backdrop[0];
    const dg = data[i + 1] - backdrop[1];
    const db = data[i + 2] - backdrop[2];
    return Math.sqrt(dr * dr + dg * dg + db * db) <= BACKDROP_TOLERANCE;
  };

  const seen = new Uint8Array(total);
  const stack = new Int32Array(total);
  let top = 0;
  const push = (pixel: number) => {
    if (seen[pixel]) return;
    seen[pixel] = 1;
    stack[top] = pixel;
    top += 1;
  };

  for (let x = 0; x < width; x += 1) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    push(y * width);
    push(y * width + width - 1);
  }

  let removed = 0;
  while (top > 0) {
    top -= 1;
    const pixel = stack[top];
    if (!isBackdrop(pixel)) continue;
    data[pixel * 4 + 3] = 0;
    removed += 1;

    const x = pixel % width;
    if (x > 0) push(pixel - 1);
    if (x < width - 1) push(pixel + 1);
    if (pixel >= width) push(pixel - width);
    if (pixel + width < total) push(pixel + width);
  }

  // Too little means the sweep is not flat (keep the photo as it is), too much
  // means we are eating the garment.
  const ratio = removed / total;
  if (ratio < 0.08 || ratio > 0.92) return img;

  ctx.putImageData(frame, 0, 0);

  // A one-pixel feather keeps the cut edge from looking scissored.
  const feathered = document.createElement("canvas");
  feathered.width = width;
  feathered.height = height;
  const fCtx = feathered.getContext("2d");
  if (!fCtx) return img;
  fCtx.filter = "blur(1px)";
  fCtx.drawImage(canvas, 0, 0);
  return feathered;
};

type PieceArt = HTMLImageElement | HTMLCanvasElement;

const pixelsOf = (art: PieceArt): { width: number; height: number } =>
  art instanceof HTMLImageElement
    ? { width: art.naturalWidth || art.width, height: art.naturalHeight || art.height }
    : { width: art.width, height: art.height };

/** A real cut-out was saved at catalog time, so its backdrop is already gone. */
const alreadyCutOut = (entry: OutfitEntry): boolean =>
  entry.kind === "catalog" &&
  Boolean(entry.product.garmentRef) &&
  entry.product.garmentRef !== entry.product.image;

/**
 * How a piece is scaled into its body region.
 *
 * Clothing is stretched to fill the region, because a product shot of a shirt
 * and the mask of a torso are close to the same shape. Stretching a shoe or a
 * bag into their region would squash them, so accessories keep their own
 * proportions instead — a hat or pair of glasses is shown whole ("contain"),
 * footwear is cropped to the foot ("cover").
 */
const placementMode = (entry: OutfitEntry, art: PieceArt, box: Box): "fill" | "cover" | "contain" => {
  if (entry.slot !== "accessory") return "fill";

  const kind = accessoryKind(entry);
  if (kind === "footwear") return "cover";
  if (kind !== "generic") return "contain";

  // An unrecognised accessory: keep its own proportions unless the region it
  // lands in is a very different shape.
  const { width: iw, height: ih } = pixelsOf(art);
  if (!iw || !ih || !box.height) return "cover";
  const ratio = box.width / box.height / (iw / ih);
  return ratio > 0.6 && ratio < 1.7 ? "cover" : "contain";
};

const emptyPose = (width: number, height: number): PoseReference => ({
  width,
  height,
  landmarks: null,
  silhouetteWidth: 0,
  silhouetteHeight: 0,
  silhouette: null,
  faceBox: { x: 0, y: 0, width: 0, height: 0 },
});

/**
 * Local composite: every selected piece is drawn onto the photo inside its own
 * body region and clipped to the feathered mask, so the face, skin, hands and
 * background are pixel-for-pixel the ones the shopper uploaded.
 */
const composeLocally = async (
  photo: string,
  pose: PoseReference | null,
  entries: OutfitEntry[],
  refs: Map<string, string>,
  report: (message: string) => void
): Promise<string> => {
  const baseImg = await loadImage(photo);
  const width = baseImg.naturalWidth || baseImg.width;
  const height = baseImg.naturalHeight || baseImg.height;
  if (!width || !height) {
    throw new FitError("no_photo", "Your photo could not be read. Please upload it again.");
  }

  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const outCtx = out.getContext("2d");
  if (!outCtx) {
    throw new FitError("unknown", "We could not prepare the fit on this device.");
  }
  outCtx.drawImage(baseImg, 0, 0, width, height);

  const maskPose = pose ?? emptyPose(width, height);
  const feather = Math.max(2, Math.round(Math.min(width, height) * 0.015));
  const ordered = [...entries].sort(
    (a, b) => PAINT_ORDER.indexOf(a.slot) - PAINT_ORDER.indexOf(b.slot)
  );

  let placed = 0;
  for (const [index, entry] of ordered.entries()) {
    const source = refs.get(entry.id);
    // A piece whose photo could not be downloaded is skipped rather than
    // risking a tainted canvas that would cost us the whole render.
    if (!source) continue;

    report(`Placing ${index + 1} of ${ordered.length} — ${entryName(entry)}…`);

    // A piece whose photo cannot be read or decoded is skipped: losing one
    // garment beats losing the whole look to a single broken image.
    let art: PieceArt;
    try {
      art = alreadyCutOut(entry)
        ? await loadImage(source)
        : knockOutBackdrop(await loadImage(source));
    } catch {
      continue;
    }

    const maskDataUrl = await generateOutfitMask(maskPose, [entry]);
    if (!maskDataUrl) continue;

    const region = await readMaskRegion(maskDataUrl, width, height);
    if (!region) continue;

    const layer = document.createElement("canvas");
    layer.width = width;
    layer.height = height;
    const layerCtx = layer.getContext("2d");
    if (!layerCtx) continue;

    const target = fitBox(art, region.box, placementMode(entry, art, region.box));
    layerCtx.drawImage(art, target.x, target.y, target.width, target.height);

    // Clip to the body region and soften the seam against the original photo.
    layerCtx.globalCompositeOperation = "destination-in";
    layerCtx.filter = `blur(${feather}px)`;
    layerCtx.drawImage(region.alpha, 0, 0, width, height);
    layerCtx.filter = "none";
    layerCtx.globalCompositeOperation = "source-over";

    outCtx.drawImage(layer, 0, 0);
    placed += 1;
  }

  if (placed === 0) {
    throw new FitError(
      "no_body",
      "We could not find where to place these pieces on your photo. Try a full-body shot."
    );
  }

  report("Finishing up…");
  try {
    return out.toDataURL("image/jpeg", 0.95);
  } catch {
    // A canvas can only be exported while every source on it is same-origin.
    // The pieces are inlined above, so this only fires if something slipped
    // through — and we say so instead of silently returning the untouched photo.
    throw new FitError(
      "unreadable_garment",
      "We couldn't finish the fit because one of the piece photos blocked the render. Try a different piece."
    );
  }
};

/**
 * Fits the selected catalog pieces onto the shopper's photo.
 *
 * The AI engine is always tried first; if the backend cannot be reached the
 * local studio engine composes the same look in-browser so the photo always
 * changes. Progress messages are reported for both paths.
 */
export async function fitLook({
  photo,
  garments,
  poseRef,
  onProgress,
  onPose,
}: FitRequest): Promise<FitResult> {
  if (!photo) {
    throw new FitError("no_photo", "Upload your photo first — then fit your whole look.");
  }
  if (garments.length === 0) {
    throw new FitError("no_pieces", "Add at least one piece to your look first.");
  }

  const report = onProgress ?? (() => {});
  const entries = entriesOf(garments);
  const groups = batchLook(entries);

  report("Reading your photo…");
  let pose: PoseReference | null = poseRef ?? null;
  if (!pose) {
    try {
      pose = await analyzePersonPhoto(photo);
      onPose?.(pose);
    } catch {
      pose = null;
    }
  }

  report("Preparing your pieces…");
  const refs = new Map<string, string>();
  await Promise.all(
    entries.map(async (entry) => {
      try {
        const reference = await garmentReference(entry);
        // Extraction can come back empty when a piece can't be read; an empty
        // reference would break both engines, so it is left out entirely.
        if (reference) refs.set(entry.id, reference);
      } catch {
        // Left out on purpose: the engines can only inline pixels they can read.
      }
    })
  );

  if (refs.size === 0) {
    throw new FitError(
      "unreadable_garment",
      "We couldn't load the photos of these pieces. Try a different piece."
    );
  }

  let aiFailure: FitError | null = null;
  try {
    return await fitWithAi(photo, pose, groups, refs, report);
  } catch (err) {
    aiFailure = err instanceof FitError ? err : await readServiceError(err);
  }

  const image = await composeLocally(photo, pose, entries, refs, report);
  return {
    image,
    engine: "studio",
    passes: groups.length,
    note: aiNote(aiFailure),
  };
}

/**
 * Why the local engine took over, phrased for the shopper. Only a missing
 * backend is worth telling them how to fix; every other reason is the service's
 * own wording, kept as-is so a quota problem never reads as a setup problem.
 */
const aiNote = (failure: FitError | null): string => {
  if (!failure) return "";
  if (failure.code === "service_unavailable") {
    return `${failure.message} Deploy the bria-tryon Supabase function for photoreal results.`;
  }
  return `${failure.message} Showing the studio preview instead.`;
}
