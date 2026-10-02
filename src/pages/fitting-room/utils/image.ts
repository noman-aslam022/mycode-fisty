export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

/**
 * Downloads a remote image and returns it as a same-origin data URL.
 * The pixel-compositing step (which locks the person's face/pose/background)
 * needs to read the image's pixels; that fails for cross-origin images the
 * browser refuses to expose, so we always convert to inline data first.
 */
export async function fetchImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) {
    throw new Error(`Could not download the fitted image (${res.status}).`);
  }
  const blob = await res.blob();
  if (!blob.size) {
    throw new Error("The fitted image came back empty.");
  }
  return blobToDataUrl(blob);
}

// Read an uploaded photo and downscale it so the try-on payload stays light.
export function fileToDownscaledDataUrl(file: File, maxEdge = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error("That image could not be loaded."));
      img.onload = () => {
        const { width, height } = img;
        const scale = Math.min(1, maxEdge / Math.max(width, height));
        const targetW = Math.max(1, Math.round(width * scale));
        const targetH = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}