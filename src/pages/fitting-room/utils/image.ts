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

/**
 * Reads an image file and returns a downscaled data URL so large camera photos
 * stay light enough to render smoothly in the studio.
 */
export const fileToDownscaledDataUrl = (file: File, maxSize = 1280): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load that image."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });