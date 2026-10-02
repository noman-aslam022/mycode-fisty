import { FilesetResolver, PoseLandmarker, ImageSegmenter } from "@mediapipe/tasks-vision";

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface BodyDetection {
  width: number;
  height: number;
  landmarks: Landmark[] | null;
  silhouetteWidth: number;
  silhouetteHeight: number;
  // Each value is 0 (not person) or 255 (person).
  silhouette: Uint8Array | null;
}

// MediaPipe ships its WASM runtime separately from the JS package. We pin the
// exact same version as the npm dependency and try a couple of CDNs.
const TASKS_VISION_VERSION = "1.0.1";

const WASM_BASES = [
  `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`,
  `https://unpkg.com/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`,
];

const POSE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const SEGMENT_MODEL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";

let posePromise: Promise<PoseLandmarker> | null = null;
let segPromise: Promise<ImageSegmenter> | null = null;

async function getFileset() {
  let lastError: unknown = null;
  for (const base of WASM_BASES) {
    try {
      return await FilesetResolver.forVisionTasks(base);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Could not load the MediaPipe runtime.");
}

function loadPoseLandmarker(): Promise<PoseLandmarker> {
  if (!posePromise) {
    posePromise = (async () => {
      const fileset = await getFileset();
      // Some browsers/GPU configurations cannot use the GPU delegate. Retry on
      // the CPU delegate so detection never silently returns "no body" (which
      // would let a catalog model's face/pose leak into the try-on).
      try {
        return await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: POSE_MODEL, delegate: "GPU" },
          runningMode: "IMAGE",
          numPoses: 1,
          minPoseDetectionConfidence: 0.4,
          minPosePresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
      } catch (gpuErr) {
        console.warn("Pose GPU delegate unavailable, retrying on CPU:", gpuErr);
        return await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: POSE_MODEL, delegate: "CPU" },
          runningMode: "IMAGE",
          numPoses: 1,
          minPoseDetectionConfidence: 0.4,
          minPosePresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
      }
    })().catch((err) => {
      posePromise = null;
      throw err;
    });
  }
  return posePromise;
}

function loadSegmenter(): Promise<ImageSegmenter> {
  if (!segPromise) {
    segPromise = (async () => {
      const fileset = await getFileset();
      try {
        return await ImageSegmenter.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: SEGMENT_MODEL, delegate: "GPU" },
          runningMode: "IMAGE",
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });
      } catch (gpuErr) {
        console.warn("Segmenter GPU delegate unavailable, retrying on CPU:", gpuErr);
        return await ImageSegmenter.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: SEGMENT_MODEL, delegate: "CPU" },
          runningMode: "IMAGE",
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });
      }
    })().catch((err) => {
      segPromise = null;
      throw err;
    });
  }
  return segPromise;
}

interface MaskLike {
  width: number;
  height: number;
  getAsUint8Array: () => Uint8Array;
  getAsFloat32Array: () => Float32Array;
  close?: () => void;
}

/**
 * Runs pose landmark detection AND person segmentation on a loaded image.
 * Each detector is attempted independently, so a failure in one still lets the
 * other succeed. Never throws for detection problems (only the caller's image
 * load can throw).
 */
export async function detectBody(img: HTMLImageElement): Promise<BodyDetection> {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  let landmarks: Landmark[] | null = null;
  let silhouette: Uint8Array | null = null;
  let silhouetteWidth = 0;
  let silhouetteHeight = 0;

  try {
    const pose = await loadPoseLandmarker();
    const result = await pose.detect(img);
    const first = result.landmarks?.[0];
    if (first && first.length) {
      landmarks = first.map((p) => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility }));
    }
  } catch (err) {
    console.warn("Pose detection unavailable:", err);
  }

  try {
    const segmenter = await loadSegmenter();
    const result = await segmenter.segment(img);
    const mask = (result.categoryMask as MaskLike | undefined) ?? null;
    const confMasks = (result.confidenceMasks as MaskLike[] | undefined) ?? [];

    if (mask) {
      const data = mask.getAsUint8Array();
      const mw = mask.width;
      const mh = mask.height;
      // Figure out which category is "background" by sampling the corners,
      // so this works whether the model labels are 0/1 or 0/255 (or inverted).
      const cornerIdx = [
        0,
        mw - 1,
        (mh - 1) * mw,
        (mh - 1) * mw + (mw - 1),
      ];
      const tally: Record<number, number> = {};
      cornerIdx.forEach((i) => {
        const v = data[i];
        tally[v] = (tally[v] ?? 0) + 1;
      });
      let backgroundCategory = 0;
      let best = -1;
      Object.entries(tally).forEach(([k, count]) => {
        if (count > best) {
          best = count;
          backgroundCategory = Number(k);
        }
      });

      const out = new Uint8Array(mw * mh);
      for (let i = 0; i < data.length; i++) {
        out[i] = data[i] !== backgroundCategory ? 255 : 0;
      }
      silhouette = out;
      silhouetteWidth = mw;
      silhouetteHeight = mh;
      mask.close?.();
    } else if (confMasks.length) {
      const m = confMasks[0];
      const data = m.getAsFloat32Array();
      const out = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        out[i] = data[i] > 0.5 ? 255 : 0;
      }
      silhouette = out;
      silhouetteWidth = m.width;
      silhouetteHeight = m.height;
      confMasks.forEach((cm) => cm.close?.());
    }

    result.close?.();
  } catch (err) {
    console.warn("Person segmentation unavailable:", err);
  }

  return { width, height, landmarks, silhouetteWidth, silhouetteHeight, silhouette };
}