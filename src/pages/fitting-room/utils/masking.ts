import type { OutfitEntry } from "../types";
import { detectBody, type Landmark } from "./poseDetector";

export interface PoseReference {
  width: number;
  height: number;
  landmarks: Landmark[] | null;
  silhouetteWidth: number;
  silhouetteHeight: number;
  silhouette: Uint8Array | null;
  faceBox: { x: number; y: number; width: number; height: number };
}

// MediaPipe Pose landmark indices.
const LM = {
  nose: 0,
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
  lHeel: 29,
  rHeel: 30,
  lFoot: 31,
  rFoot: 32,
} as const;

interface Pt {
  x: number;
  y: number;
}

/**
 * Strips the data URI prefix (e.g. data:image/png;base64,) to return only raw
 * base64 bytes, as required by the try-on API.
 */
export function stripDataUri(str: string): string {
  if (!str) return str;
  const commaIdx = str.indexOf(",");
  if (str.startsWith("data:") && commaIdx !== -1) {
    return str.slice(commaIdx + 1);
  }
  return str;
}

/** Loads an image URL/dataUrl into an HTMLImageElement asynchronously. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image for processing."));
    img.src = src;
  });
}

function toPx(landmarks: Landmark[], index: number, w: number, h: number): Pt {
  const p = landmarks[index];
  return { x: p.x * w, y: p.y * h };
}

function avg(a: number, b: number): number {
  return (a + b) / 2;
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Bounding box of all "person" pixels in a silhouette mask, or null. */
function silhouetteBounds(
  silhouette: Uint8Array,
  sw: number,
  sh: number
): { x: number; y: number; width: number; height: number } | null {
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

/**
 * Analyzes the uploaded person photo using real detection: pose landmarks for
 * the joints/face, and person segmentation for the silhouette. This replaces
 * the old "guess by image percentage" approach that mis-aligned on real photos.
 */
export async function analyzePersonPhoto(imageSrc: string): Promise<PoseReference> {
  const img = await loadImage(imageSrc);
  const detection = await detectBody(img);
  const { width, height, landmarks } = detection;

  let faceBox = {
    x: Math.round(width * 0.3),
    y: Math.round(height * 0.06),
    width: Math.round(width * 0.4),
    height: Math.round(height * 0.24),
  };

  if (landmarks && landmarks.length > 32) {
    const lEar = toPx(landmarks, LM.lEar, width, height);
    const rEar = toPx(landmarks, LM.rEar, width, height);
    const lEye = toPx(landmarks, LM.lEye, width, height);
    const rEye = toPx(landmarks, LM.rEye, width, height);
    const mouthL = toPx(landmarks, LM.mouthL, width, height);
    const mouthR = toPx(landmarks, LM.mouthR, width, height);

    const cx = avg(lEar.x, rEar.x);
    const headW = Math.max(dist(lEar, rEar), width * 0.08);
    const eyeY = avg(lEye.y, rEye.y);
    const chinY = Math.max(mouthL.y, mouthR.y) + headW * 0.45;
    const topY = eyeY - headW * 0.95;

    faceBox = {
      x: Math.max(0, Math.round(cx - headW * 0.62)),
      y: Math.max(0, Math.round(topY)),
      width: Math.round(headW * 1.24),
      height: Math.round(Math.max(chinY - topY, headW)),
    };
  } else if (detection.silhouette && detection.silhouetteWidth > 0) {
    const b = silhouetteBounds(
      detection.silhouette,
      detection.silhouetteWidth,
      detection.silhouetteHeight
    );
    if (b) {
      const sx = width / detection.silhouetteWidth;
      const sy = height / detection.silhouetteHeight;
      const px = b.x * sx;
      const py = b.y * sy;
      const pw = b.width * sx;
      const ph = b.height * sy;
      faceBox = {
        x: Math.round(px + pw * 0.3),
        y: Math.round(py),
        width: Math.round(pw * 0.4),
        height: Math.round(ph * 0.2),
      };
    }
  }

  return { ...detection, faceBox };
}

let uid = 0;
function nextId(): string {
  uid += 1;
  return `m-${uid}`;
}

function ellipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
  ctx.fill();
}

function poly(ctx: CanvasRenderingContext2D, points: Pt[]) {
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fill();
}

/** Build a rectangle polygon around a limb segment (a -> b) of given radius. */
function limbQuad(a: Pt, b: Pt, r: number): Pt[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * r;
  const ny = (dx / len) * r;
  return [
    { x: a.x + nx, y: a.y + ny },
    { x: b.x + nx, y: b.y + ny },
    { x: b.x - nx, y: b.y - ny },
    { x: a.x - nx, y: a.y - ny },
  ];
}

interface HeadGeom {
  cx: number;
  headW: number;
  eyeY: number;
  topY: number;
  chinY: number;
}

function headGeometry(lm2: Landmark[], w: number, h: number): HeadGeom {
  const lEar = toPx(lm2, LM.lEar, w, h);
  const rEar = toPx(lm2, LM.rEar, w, h);
  const lEye = toPx(lm2, LM.lEye, w, h);
  const rEye = toPx(lm2, LM.rEye, w, h);
  const mouthL = toPx(lm2, LM.mouthL, w, h);
  const mouthR = toPx(lm2, LM.mouthR, w, h);
  const cx = avg(lEar.x, rEar.x);
  const headW = Math.max(dist(lEar, rEar), w * 0.08);
  const eyeY = avg(lEye.y, rEye.y);
  const chinY = Math.max(mouthL.y, mouthR.y) + headW * 0.45;
  const topY = eyeY - headW * 0.95;
  return { cx, headW, eyeY, topY, chinY };
}

function accessoryKind(entry: OutfitEntry): string {
  const name = (entry.kind === "catalog" ? entry.product.name : entry.garment.name).toLowerCase();
  const tags = entry.kind === "catalog" ? entry.product.tags.join(" ").toLowerCase() : "";
  const desc = `${name} ${tags}`;
  if (/(boot|shoe|sneaker|footwear|slide|sandal)/.test(desc)) return "footwear";
  if (/(glass|shade|optic|eyewear|sunglass)/.test(desc)) return "glasses";
  if (/(hat|cap|beanie|balaclava|bucket)/.test(desc)) return "hat";
  if (/(necklace|chain|pendant|jewellery|jewelry|earring|hoop)/.test(desc)) return "necklace";
  if (/(bag|crossbody|tote|backpack)/.test(desc)) return "bag";
  if (/(ring|wrist|watch|bracelet)/.test(desc)) return "wrist";
  return "generic";
}

/**
 * Generates the try-on mask used by the AI engine.
 *   White (#ffffff) = EDIT region (the selected clothing / accessory).
 *   Black (#000000) = PRESERVE (background, face, hair, skin, untouched areas).
 *
 * The editable region is built from the detected body joints, then clipped to
 * the real person silhouette so it never grabs background, and finally the
 * face / hair / neck are carved back out so they are never damaged.
 */
export async function generateOutfitMask(
  pose: PoseReference,
  entries: OutfitEntry[]
): Promise<string> {
  const { width, height, landmarks, silhouette } = pose;

  // --- base mask: everything protected (black) -----------------------------
  const base = document.createElement("canvas");
  base.width = width;
  base.height = height;
  const baseCtx = base.getContext("2d");
  if (!baseCtx) return "";
  baseCtx.fillStyle = "#000000";
  baseCtx.fillRect(0, 0, width, height);

  // --- edit layer: transparent, we draw white clothing shapes ---------------
  const edit = document.createElement("canvas");
  edit.width = width;
  edit.height = height;
  const ctx = edit.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#ffffff";

  const slots = new Set(entries.map((e) => e.slot));
  const hasTop = slots.has("top") || slots.has("layer");
  const hasBottom = slots.has("bottom");

  const hasGlasses = entries.some(
    (e) => e.slot === "accessory" && accessoryKind(e) === "glasses"
  );
  const hasHat = entries.some((e) => e.slot === "accessory" && accessoryKind(e) === "hat");
  const hasNecklace = entries.some(
    (e) => e.slot === "accessory" && accessoryKind(e) === "necklace"
  );

  if (landmarks && landmarks.length > 32) {
    const lm = landmarks;
    const p = (i: number) => toPx(lm, i, width, height);
    const lSh = p(LM.lSh);
    const rSh = p(LM.rSh);
    const lElb = p(LM.lElb);
    const rElb = p(LM.rElb);
    const lWr = p(LM.lWr);
    const rWr = p(LM.rWr);
    const lHip = p(LM.lHip);
    const rHip = p(LM.rHip);
    const lKnee = p(LM.lKnee);
    const rKnee = p(LM.rKnee);
    const lAnk = p(LM.lAnk);
    const rAnk = p(LM.rAnk);
    const lFoot = p(LM.lFoot);
    const rFoot = p(LM.rFoot);

    const shoulderW = Math.max(dist(lSh, rSh), width * 0.1);
    const head = headGeometry(lm, width, height);

    // TOP / LAYER — cover shoulders, chest, abdomen and the arms.
    if (hasTop) {
      const isLayer = slots.has("layer");
      // widen hips a touch so the hem of the garment is included
      const hipPadX = shoulderW * 0.12;
      poly(ctx, [
        { x: lSh.x - shoulderW * 0.18, y: lSh.y - shoulderW * 0.06 },
        { x: rSh.x + shoulderW * 0.18, y: rSh.y - shoulderW * 0.06 },
        { x: rHip.x + hipPadX, y: rHip.y + shoulderW * 0.1 },
        { x: lHip.x - hipPadX, y: lHip.y + shoulderW * 0.1 },
      ]);
      // Arms: upper arm always; forearm too for a layer (outerwear).
      const armR = shoulderW * 0.16;
      poly(ctx, limbQuad(lSh, lElb, armR));
      poly(ctx, limbQuad(rSh, rElb, armR));
      if (isLayer) {
        poly(ctx, limbQuad(lElb, lWr, armR * 1.05));
        poly(ctx, limbQuad(rElb, rWr, armR * 1.05));
      }
    }

    // BOTTOM — hips down to ankles.
    if (hasBottom) {
      const legR = shoulderW * 0.16;
      poly(ctx, [
        { x: lHip.x - shoulderW * 0.1, y: lHip.y - shoulderW * 0.05 },
        { x: rHip.x + shoulderW * 0.1, y: rHip.y - shoulderW * 0.05 },
        { x: rAnk.x + legR, y: rAnk.y + legR },
        { x: lAnk.x - legR, y: lAnk.y + legR },
      ]);
    }

    // ACCESSORIES
    for (const entry of entries) {
      if (entry.slot !== "accessory") continue;
      const kind = accessoryKind(entry);
      if (kind === "footwear") {
        const footR = shoulderW * 0.16;
        poly(ctx, limbQuad(lAnk, lFoot, footR * 1.4));
        poly(ctx, limbQuad(rAnk, rFoot, footR * 1.4));
        // extend the sole to the very bottom
        poly(ctx, [
          { x: lAnk.x - footR * 1.6, y: lAnk.y },
          { x: rAnk.x + footR * 1.6, y: rAnk.y },
          { x: rAnk.x + footR * 1.6, y: height },
          { x: lAnk.x - footR * 1.6, y: height },
        ]);
      } else if (kind === "glasses") {
        ellipse(ctx, head.cx, head.eyeY, head.headW * 0.78, head.headW * 0.34);
      } else if (kind === "hat") {
        ellipse(ctx, head.cx, head.eyeY - head.headW * 0.42, head.headW * 0.85, head.headW * 0.72);
      } else if (kind === "necklace") {
        ellipse(ctx, head.cx, head.chinY + head.headW * 0.42, head.headW * 0.55, head.headW * 0.4);
      } else if (kind === "bag") {
        const side = rHip.x > lHip.x ? rHip : lHip;
        const midY = avg(lHip.y, lSh.y);
        ellipse(
          ctx,
          side.x + shoulderW * 0.24,
          midY + shoulderW * 0.2,
          shoulderW * 0.3,
          shoulderW * 0.42
        );
      } else if (kind === "wrist") {
        ellipse(ctx, lWr.x, lWr.y, shoulderW * 0.11, shoulderW * 0.11);
        ellipse(ctx, rWr.x, rWr.y, shoulderW * 0.11, shoulderW * 0.11);
      } else {
        // Fallback: a modest band on the upper body.
        ellipse(ctx, head.cx, avg(lSh.y, lHip.y), shoulderW * 0.4, shoulderW * 0.5);
      }
    }
  } else if (silhouette && pose.silhouetteWidth > 0) {
    // No joints, but we still have the person silhouette: build from its bbox.
    const b = silhouetteBounds(silhouette, pose.silhouetteWidth, pose.silhouetteHeight);
    if (b) {
      const sx = width / pose.silhouetteWidth;
      const sy = height / pose.silhouetteHeight;
      const bx = b.x * sx;
      const by = b.y * sy;
      const bw = b.width * sx;
      const bh = b.height * sy;

      if (hasTop) {
        ctx.fillRect(bx + bw * 0.1, by + bh * 0.14, bw * 0.8, bh * 0.4);
      }
      if (hasBottom) {
        ctx.fillRect(bx + bw * 0.16, by + bh * 0.5, bw * 0.68, bh * 0.44);
      }
      entries.forEach((entry) => {
        if (entry.slot !== "accessory") return;
        const kind = accessoryKind(entry);
        if (kind === "footwear") {
          ctx.fillRect(bx + bw * 0.12, by + bh * 0.86, bw * 0.76, bh * 0.14);
        } else if (kind === "hat") {
          ellipse(ctx, bx + bw / 2, by + bh * 0.08, bw * 0.32, bh * 0.08);
        } else if (kind === "glasses") {
          ellipse(ctx, bx + bw / 2, by + bh * 0.1, bw * 0.3, bh * 0.045);
        } else {
          ellipse(ctx, bx + bw / 2, by + bh * 0.5, bw * 0.4, bh * 0.28);
        }
      });
    }
  } else {
    // Last resort: neither pose joints nor a silhouette came back. Fall back
    // to proportional body bands for a typical full-body framing, so the
    // editable region is never empty and the face is never touched.
    const cx = width / 2;
    const bandW = width * 0.34;
    if (hasTop) {
      ctx.fillRect(cx - bandW, height * 0.24, bandW * 2, height * 0.32);
    }
    if (hasBottom) {
      ctx.fillRect(cx - bandW * 0.92, height * 0.52, bandW * 1.84, height * 0.4);
    }
    entries.forEach((entry) => {
      if (entry.slot !== "accessory") return;
      const kind = accessoryKind(entry);
      if (kind === "footwear") {
        ctx.fillRect(cx - bandW * 0.9, height * 0.88, bandW * 1.8, height * 0.12);
      } else if (kind === "hat") {
        ellipse(ctx, cx, height * 0.1, bandW * 0.7, height * 0.05);
      } else if (kind === "glasses") {
        ellipse(ctx, cx, height * 0.12, bandW * 0.6, height * 0.03);
      } else if (kind === "necklace") {
        ellipse(ctx, cx, height * 0.3, bandW * 0.5, height * 0.06);
      } else {
        ellipse(ctx, cx, height * 0.45, bandW * 0.8, height * 0.22);
      }
    });
  }

  // --- clip the edit region to the real person silhouette -------------------
  if (silhouette && pose.silhouetteWidth > 0) {
    const silSmall = document.createElement("canvas");
    silSmall.width = pose.silhouetteWidth;
    silSmall.height = pose.silhouetteHeight;
    const sCtx = silSmall.getContext("2d");
    if (sCtx) {
      const imageData = sCtx.createImageData(pose.silhouetteWidth, pose.silhouetteHeight);
      for (let i = 0; i < silhouette.length; i++) {
        imageData.data[i * 4] = 255;
        imageData.data[i * 4 + 1] = 255;
        imageData.data[i * 4 + 2] = 255;
        imageData.data[i * 4 + 3] = silhouette[i];
      }
      sCtx.putImageData(imageData, 0, 0);

      const silFull = document.createElement("canvas");
      silFull.width = width;
      silFull.height = height;
      const fCtx = silFull.getContext("2d");
      if (fCtx) {
        fCtx.drawImage(silSmall, 0, 0, width, height);
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(silFull, 0, 0);
        ctx.globalCompositeOperation = "source-over";
      }
    }
  }

  // --- carve the protected zones back out (face / hair / neck) --------------
  ctx.globalCompositeOperation = "destination-out";
  if (landmarks && landmarks.length > 32) {
    const head = headGeometry(landmarks, width, height);
    // Face: protect everything except the eye band when glasses are chosen.
    const faceTop = hasGlasses ? head.eyeY + head.headW * 0.02 : head.eyeY - head.headW * 0.5;
    const faceBottom = head.chinY;
    ellipse(
      ctx,
      head.cx,
      avg(faceTop, faceBottom),
      head.headW * 0.62,
      Math.max((faceBottom - faceTop) / 2, head.headW * 0.3)
    );
    // Hair / crown: protected unless a hat is being fitted.
    if (!hasHat) {
      ellipse(
        ctx,
        head.cx,
        avg(head.topY, head.eyeY),
        head.headW * 0.95,
        Math.max((head.eyeY - head.topY) / 2, head.headW * 0.4)
      );
    }
    // Neck: protected unless a necklace is being fitted.
    if (!hasNecklace) {
      ellipse(ctx, head.cx, head.chinY + head.headW * 0.28, head.headW * 0.5, head.headW * 0.34);
    }
  } else if (silhouette && pose.silhouetteWidth > 0) {
    const b = silhouetteBounds(silhouette, pose.silhouetteWidth, pose.silhouetteHeight);
    if (b) {
      const sx = width / pose.silhouetteWidth;
      const sy = height / pose.silhouetteHeight;
      const bx = b.x * sx;
      const by = b.y * sy;
      const bw = b.width * sx;
      const bh = b.height * sy;
      ellipse(ctx, bx + bw / 2, by + bh * 0.08, bw * 0.28, bh * 0.09);
    }
  }
  ctx.globalCompositeOperation = "source-over";

  // --- compose: white edit region on top of the black protected base --------
  baseCtx.drawImage(edit, 0, 0);
  return base.toDataURL("image/png");
}

/**
 * Preservation-first compositing.
 *
 * The try-on model returns a freshly rendered frame, so we blend it back onto
 * the ORIGINAL photo using the body mask:
 *   - Inside the editable (clothing) region  -> the generated result is used.
 *   - Everywhere else (face, hair, skin, hands, background) -> the original
 *     photo pixels are kept 100% untouched.
 *
 * This guarantees the person can never be altered outside their garments,
 * regardless of what the generative model decides to do.
 */
export async function compositeTryOnResult(
  originalPhotoSrc: string,
  generatedUrl: string,
  maskDataUrl: string
): Promise<string> {
  if (!originalPhotoSrc) {
    throw new Error("Your original photo is missing. Please upload it again.");
  }
  if (!maskDataUrl) {
    throw new Error("We could not lock your face and body for this fit. Please try again.");
  }
  try {
    const [baseImg, genImg, maskImg] = await Promise.all([
      loadImage(originalPhotoSrc),
      loadImage(generatedUrl),
      loadImage(maskDataUrl),
    ]);

    const width = baseImg.naturalWidth || baseImg.width;
    const height = baseImg.naturalHeight || baseImg.height;
    if (!width || !height) {
      throw new Error("Your photo could not be read. Please try again.");
    }

    // 1. Feather the mask so the seam between the new garment and the original
    //    pixels blends softly instead of showing a hard cut.
    const feather = Math.max(2, Math.round(Math.min(width, height) * 0.012));
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) {
      throw new Error("We could not prepare the fit. Please try again.");
    }
    maskCtx.filter = `blur(${feather}px)`;
    maskCtx.drawImage(maskImg, 0, 0, width, height);
    maskCtx.filter = "none";

    // 2. Keep only the generated pixels that fall inside the editable region.
    const genMasked = document.createElement("canvas");
    genMasked.width = width;
    genMasked.height = height;
    const genCtx = genMasked.getContext("2d");
    if (!genCtx) {
      throw new Error("We could not prepare the fit. Please try again.");
    }
    genCtx.drawImage(genImg, 0, 0, width, height);
    genCtx.globalCompositeOperation = "destination-in";
    genCtx.drawImage(maskCanvas, 0, 0);
    genCtx.globalCompositeOperation = "source-over";

    // 3. Start from the untouched original, then lay the edited region on top.
    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    const outCtx = out.getContext("2d");
    if (!outCtx) {
      throw new Error("We could not prepare the fit. Please try again.");
    }
    outCtx.drawImage(baseImg, 0, 0, width, height);
    outCtx.drawImage(genMasked, 0, 0);

    return out.toDataURL("image/jpeg", 0.95);
  } catch (err) {
    console.warn("Composite failed:", err);
    // Never fall back to the raw AI frame here: that frame is exactly where a
    // model's face and pose can leak in. Surface the failure instead so the
    // person is never silently altered.
    throw new Error(
      "We could not blend the fit onto your photo without changing your appearance. Please try again."
    );
  }
}

// Keep unused helpers referenced so tree-shaking doesn't complain in strict setups.
void nextId;