import type { OutfitSlot } from "../types";
import { detectBody, type BodyDetection, type Landmark } from "./poseDetector";
import { loadImage } from "./masking";

/**
 * Garment extraction.
 *
 * Product photos come in two flavours:
 *   1. A clean product-only shot (flat lay / ghost mannequin) — no human.
 *   2. A lifestyle shot showing a model WEARING the piece.
 *
 * If we hand flavour (2) straight to the try-on engine, the engine sees a second
 * human and can borrow that model's face, hair and pose. This module fixes that:
 * it detects whether the reference actually contains a person, and if so it
 * crops the image down to just the garment region for that slot, removes the
 * background, and carves out the head / hair / neck so no human features
 * survive. The result is a human-free garment reference.
 *
 * Product-only shots are returned untouched, so flat-lay uploads keep working
 * exactly as before.
 */

// MediaPipe Pose landmark indices (mirrors masking.ts).
const LM = {
  lEye: 2,
  rEye: 5,
  lEar: 7,
  rEar: 8,
  mouthL: 9,
  mouthR: 10,
  lSh: 11,
  rSh: 12,
  lElb: 13,
  rElb: 14,
  lWr: 15,
  rWr: 16,
  lHip: 23,
  rHip: 24,
  lKnee: 25,
  rKnee: 26,
  lAnk: 27,
  rAnk: 28,
} as const;

interface Pt {
  x: number;
  y: number;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Memoize by slot + source so we never re-extract the same piece twice.
const cache = new Map<string, string>();

function toPx(landmarks: Landmark[], index: number, w: number, h: number): Pt {
  const p = landmarks[index];
  return { x: p.x * w, y: p.y * h };
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function avg(a: number, b: number): number {
  return (a + b) / 2;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Bounding box of the person in a silhouette mask, or null. */
function silhouetteBounds(silhouette: Uint8Array, sw: number, sh: number): Box | null {
  let minX = sw;
  let minY = sh;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (silhouette[y * sw + x] > 127) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0 || maxY < 0) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function clampBox(box: Box, w: number, h: number): Box | null {
  const x0 = clamp(box.x, 0, w);
  const y0 = clamp(box.y, 0, h);
  const x1 = clamp(box.x + box.width, 0, w);
  const y1 = clamp(box.y + box.height, 0, h);
  const width = x1 - x0;
  const height = y1 - y0;
  if (width < w * 0.06 || height < h * 0.06) return null;
  return { x: x0, y: y0, width, height };
}

interface HeadGeom {
  cx: number;
  headW: number;
  eyeY: number;
  topY: number;
  chinY: number;
}

function headGeometry(landmarks: Landmark[], w: number, h: number): HeadGeom {
  const p = (i: number) => toPx(landmarks, i, w, h);
  const lEar = p(LM.lEar);
  const rEar = p(LM.rEar);
  const lEye = p(LM.lEye);
  const rEye = p(LM.rEye);
  const mouthL = p(LM.mouthL);
  const mouthR = p(LM.mouthR);
  const cx = avg(lEar.x, rEar.x);
  const headW = Math.max(dist(lEar, rEar), w * 0.08);
  const eyeY = avg(lEye.y, rEye.y);
  const chinY = Math.max(mouthL.y, mouthR.y) + headW * 0.45;
  const topY = eyeY - headW * 0.95;
  return { cx, headW, eyeY, topY, chinY };
}

/**
 * Crop window for the garment, derived from the detected pose joints.
 * Returns null when the joints are too weak to trust.
 */
function boxFromLandmarks(
  landmarks: Landmark[],
  w: number,
  h: number,
  slot: OutfitSlot
): Box | null {
  const p = (i: number) => toPx(landmarks, i, w, h);
  const lSh = p(LM.lSh);
  const rSh = p(LM.rSh);
  const lHip = p(LM.lHip);
  const rHip = p(LM.rHip);
  const lKnee = p(LM.lKnee);
  const rKnee = p(LM.rKnee);
  const lAnk = p(LM.lAnk);
  const rAnk = p(LM.rAnk);
  const lEar = p(LM.lEar);
  const rEar = p(LM.rEar);
  const lEye = p(LM.lEye);
  const rEye = p(LM.rEye);

  const shoulderW = dist(lSh, rSh);
  // Too small / collapsed shoulders means the pose is unreliable — bail out and
  // keep the original image rather than crop the wrong area.
  if (shoulderW < w * 0.04) return null;

  const headW = Math.max(dist(lEar, rEar), w * 0.05);
  const eyeY = avg(lEye.y, rEye.y);
  const hipY = avg(lHip.y, rHip.y);
  const ankleY = avg(lAnk.y, rAnk.y);
  const kneeY = avg(lKnee.y, rKnee.y);

  let box: Box;
  if (slot === "top" || slot === "layer") {
    const cx = avg(lSh.x, rSh.x);
    const halfW = shoulderW;
    // Start the crop at the shoulders/neck, NOT at the chin, so no face or
    // hair can ever be included in the garment reference.
    const y0 = Math.min(lSh.y, rSh.y) - shoulderW * 0.3;
    const bottom = slot === "layer" ? avg(hipY, kneeY) : hipY + shoulderW * 0.35;
    box = {
      x: cx - halfW,
      y: y0,
      width: halfW * 2,
      height: bottom - y0,
    };
  } else if (slot === "bottom") {
    const halfW = shoulderW * 0.78;
    const x0 = Math.min(lHip.x, rHip.x) - halfW;
    const x1 = Math.max(lHip.x, rHip.x) + halfW;
    const y0 = hipY - shoulderW * 0.28;
    box = {
      x: x0,
      y: y0,
      width: x1 - x0,
      height: ankleY + shoulderW * 0.32 - y0,
    };
  } else {
    // Accessory: head-centred window (glasses, hats, eyewear, earrings).
    const cx = avg(lEar.x, rEar.x);
    const topY = eyeY - headW * 1.15;
    const bottomY = chinYFrom(landmarks, w, h, headW);
    box = {
      x: cx - headW * 1.35,
      y: topY,
      width: headW * 2.7,
      height: bottomY - topY,
    };
  }

  return clampBox(box, w, h);
}

function chinYFrom(
  landmarks: Landmark[],
  w: number,
  h: number,
  headW: number
): number {
  const mouthL = toPx(landmarks, LM.mouthL, w, h);
  const mouthR = toPx(landmarks, LM.mouthR, w, h);
  return Math.max(mouthL.y, mouthR.y) + headW * 0.45 + headW * 0.55;
}

/** Fallback crop when joints are unavailable but the person silhouette exists. */
function boxFromSilhouette(box: Box, slot: OutfitSlot): Box {
  const { x, y, width: w, height: h } = box;
  if (slot === "top" || slot === "layer") {
    // Skip the top ~14% (head) so no face/hair is captured.
    return { x: x + w * 0.1, y: y + h * 0.14, width: w * 0.8, height: h * 0.42 };
  }
  if (slot === "bottom") {
    return { x: x + w * 0.14, y: y + h * 0.5, width: w * 0.72, height: h * 0.46 };
  }
  return { x: x + w * 0.25, y, width: w * 0.5, height: h * 0.24 };
}

/**
 * Erase the person's head / hair / neck from the cropped reference so a
 * model's face can never leak into the try-on input.
 */
function eraseHead(
  ctx: CanvasRenderingContext2D,
  detection: BodyDetection,
  box: Box,
  cw: number,
  ch: number
) {
  const landmarks = detection.landmarks;
  if (!landmarks || landmarks.length < 29) return;
  const w = detection.width;
  const h = detection.height;
  const head = headGeometry(landmarks, w, h);
  const sx = cw / box.width;
  const sy = ch / box.height;
  const mapX = (x: number) => (x - box.x) * sx;
  const mapY = (y: number) => (y - box.y) * sy;

  const top = mapY(head.topY);
  const chin = mapY(head.chinY);
  const cx = mapX(head.cx);

  ctx.globalCompositeOperation = "destination-out";
  // Face + hair.
  ctx.beginPath();
  ctx.ellipse(
    cx,
    avg(top, chin),
    head.headW * 0.98 * sx,
    Math.max((chin - top) / 2, head.headW * 0.42 * sy),
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  // Neck.
  ctx.beginPath();
  ctx.ellipse(
    cx,
    mapY(head.chinY + head.headW * 0.28),
    head.headW * 0.55 * sx,
    head.headW * 0.36 * sy,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
}

/** Crop the source, knock out the background, and remove any human features. */
function cropAndCutout(
  img: HTMLImageElement,
  detection: BodyDetection,
  box: Box,
  w: number,
  h: number,
  slot: OutfitSlot
): string {
  const cw = Math.max(1, Math.round(box.width));
  const ch = Math.max(1, Math.round(box.height));

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.drawImage(img, box.x, box.y, box.width, box.height, 0, 0, cw, ch);

  // Remove the studio background so only the garment silhouette remains.
  const { silhouette, silhouetteWidth, silhouetteHeight } = detection;
  if (silhouette && silhouetteWidth > 0 && silhouetteHeight > 0) {
    const silSmall = document.createElement("canvas");
    silSmall.width = silhouetteWidth;
    silSmall.height = silhouetteHeight;
    const sCtx = silSmall.getContext("2d");
    if (sCtx) {
      const imageData = sCtx.createImageData(silhouetteWidth, silhouetteHeight);
      for (let i = 0; i < silhouette.length; i++) {
        imageData.data[i * 4] = 255;
        imageData.data[i * 4 + 1] = 255;
        imageData.data[i * 4 + 2] = 255;
        imageData.data[i * 4 + 3] = silhouette[i];
      }
      sCtx.putImageData(imageData, 0, 0);

      const silFull = document.createElement("canvas");
      silFull.width = w;
      silFull.height = h;
      const fCtx = silFull.getContext("2d");
      if (fCtx) {
        fCtx.drawImage(silSmall, 0, 0, w, h);
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(silFull, box.x, box.y, box.width, box.height, 0, 0, cw, ch);
        ctx.globalCompositeOperation = "source-over";
      }
    }
  }

  // Garments only — never carry the model's face, hair or neck across.
  if (slot !== "accessory") {
    eraseHead(ctx, detection, box, cw, ch);
  }

  try {
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.warn("Garment crop could not be exported:", err);
    return "";
  }
}

/**
 * Last-resort crop window when neither pose joints nor a silhouette are
 * available but we still KNOW the photo shows a person (on-model shot). It
 * uses sensible full-body proportions so the head is biased out of frame and
 * only the garment band is kept — never the whole person.
 */
function boxFromProportions(w: number, h: number, slot: OutfitSlot): Box {
  if (slot === "top" || slot === "layer") {
    return { x: w * 0.16, y: h * 0.2, width: w * 0.68, height: h * 0.42 };
  }
  if (slot === "bottom") {
    return { x: w * 0.2, y: h * 0.5, width: w * 0.6, height: h * 0.45 };
  }
  return { x: w * 0.24, y: h * 0.03, width: w * 0.52, height: h * 0.28 };
}

interface DetectionFacts {
  width: number;
  height: number;
  hasLandmarks: boolean;
  hasSilhouette: boolean;
  box: Box | null;
}

/** Works out whether a photo contains a person and, if so, the garment crop. */
function inspect(
  detection: BodyDetection,
  w: number,
  h: number,
  slot: OutfitSlot
): DetectionFacts {
  const landmarks = detection.landmarks;
  const hasLandmarks = Boolean(landmarks && landmarks.length >= 29);
  const hasSilhouette = Boolean(
    detection.silhouette && detection.silhouetteWidth > 0
  );

  let box: Box | null = null;
  if (hasLandmarks && landmarks) {
    box = boxFromLandmarks(landmarks, w, h, slot);
  }
  if (!box && hasSilhouette && detection.silhouette) {
    const b = silhouetteBounds(
      detection.silhouette,
      detection.silhouetteWidth,
      detection.silhouetteHeight
    );
    if (b) {
      const sxb = w / detection.silhouetteWidth;
      const syb = h / detection.silhouetteHeight;
      box = boxFromSilhouette(
        { x: b.x * sxb, y: b.y * syb, width: b.width * sxb, height: b.height * syb },
        slot
      );
    }
  }

  return { width: w, height: h, hasLandmarks, hasSilhouette, box };
}

/**
 * Returns a human-free garment reference for the try-on engine.
 * Falls back to the original source whenever the image is already a clean
 * product shot, or when detection/export is not possible.
 *
 * `onModel` is the reliable hint we store at upload time. When it is true and
 * live detection fails, we STILL crop the garment band geometrically instead of
 * handing the whole person photo to the try-on engine — that is what prevents a
 * model's face and pose from leaking through on tricky images.
 */
export async function extractGarmentReference(
  source: string,
  slot: OutfitSlot,
  opts?: { onModel?: boolean }
): Promise<string> {
  if (!source) return source;

  const key = `${slot}::${opts?.onModel ? "m" : "a"}::${source}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const img = await loadImage(source);
    const detection = await detectBody(img);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    if (!w || !h) {
      cache.set(key, source);
      return source;
    }

    const facts = inspect(detection, w, h, slot);
    let box = facts.box;

    if (!box && opts?.onModel) {
      // We know this is an on-model shot but detection came back empty — crop
      // the garment band by proportion rather than leaking the whole person.
      box = boxFromProportions(w, h, slot);
    }

    if (!box) {
      // No human at all → this is already a clean product-only shot.
      cache.set(key, source);
      return source;
    }

    const cropped = cropAndCutout(img, detection, box, w, h, slot);
    const result = cropped || source;
    cache.set(key, result);
    return result;
  } catch (err) {
    console.warn("Garment extraction skipped:", err);
    if (opts?.onModel) {
      // Never leak an on-model photo when detection itself failed.
      return source;
    }
    return source;
  }
}

export interface GarmentBuildResult {
  // Whether the source photo shows a model (auto-detected or forced).
  onModel: boolean;
  // Whether live pose/segment detection actually ran on the image.
  detectionAvailable: boolean;
  // The human-free reference to store. Equals the source for clean flat shots.
  reference: string;
}

/**
 * Upload-time step: inspect a product photo and build the human-free garment
 * reference that the try-on engine will use. Run once when the owner saves a
 * product, so every on-model shot is tagged and pre-extracted up front — the
 * fit step then never has to trust a raw on-model photo.
 */
export async function buildGarmentReference(
  source: string,
  slot: OutfitSlot,
  forceOnModel = false
): Promise<GarmentBuildResult> {
  if (!source) {
    return { onModel: false, detectionAvailable: false, reference: source };
  }

  try {
    const img = await loadImage(source);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) {
      return { onModel: forceOnModel, detectionAvailable: false, reference: source };
    }

    const detection = await detectBody(img);
    const facts = inspect(detection, w, h, slot);
    const detectionAvailable = facts.hasLandmarks || facts.hasSilhouette;
    const onModel = detectionAvailable || forceOnModel;

    if (!onModel) {
      // Clean product shot — keep it exactly as-is.
      return { onModel: false, detectionAvailable, reference: source };
    }

    const box = facts.box ?? boxFromProportions(w, h, slot);
    const cropped = cropAndCutout(img, detection, box, w, h, slot);
    return { onModel: true, detectionAvailable, reference: cropped || source };
  } catch (err) {
    console.warn("Garment build skipped:", err);
    return { onModel: forceOnModel, detectionAvailable: false, reference: source };
  }
}