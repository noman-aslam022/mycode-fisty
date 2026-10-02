import { useRef, useState } from "react";
import { MAX_UPLOAD_BYTES, fileToDownscaledDataUrl } from "@/pages/fitting-room/utils/image";

interface UploadDropzoneProps {
  photo: string | null;
  onPhoto: (dataUrl: string) => void;
  onClear: () => void;
}

export default function UploadDropzone({ photo, onPhoto, onClear }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const process = async (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose a JPG or PNG image.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That image is a little large — please use one under 12MB.");
      return;
    }
    try {
      setBusy(true);
      const dataUrl = await fileToDownscaledDataUrl(file);
      onPhoto(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load that image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) process(file);
          e.target.value = "";
        }}
      />

      {photo ? (
        <div className="relative rounded-lg border border-background-200 bg-background-50 overflow-hidden">
          <div className="relative w-full aspect-[3/4] max-h-[520px] bg-background-100">
            <img
              src={photo}
              alt="Your uploaded photo for the Fitsy fitting room"
              title="Your photo"
              className="w-full h-full object-cover object-top"
            />
            <span className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground-950/80 backdrop-blur text-background-50 text-xs font-medium">
              <i className="ri-checkbox-circle-fill text-primary-500"></i>
              Photo ready
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md border border-background-300 text-sm font-semibold text-foreground-950 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-refresh-line"></i>
              Replace photo
            </button>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md text-sm font-semibold text-foreground-600 hover:text-accent-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-delete-bin-line"></i>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) process(file);
          }}
          className={`flex flex-col items-center justify-center text-center rounded-lg border-2 border-dashed px-6 py-14 md:py-20 transition-colors ${
            dragging ? "border-primary-500 bg-primary-50" : "border-background-300 bg-background-100/60"
          }`}
        >
          <span className="w-16 h-16 rounded-full bg-background-50 flex items-center justify-center border border-background-200">
            <i className={`ri-upload-cloud-2-line text-3xl ${busy ? "text-foreground-400 animate-pulse" : "text-foreground-950"}`}></i>
          </span>
          <h3 className="mt-5 font-heading font-semibold text-lg text-foreground-950">
            {busy ? "Preparing your photo…" : "Drop your photo here"}
          </h3>
          <p className="mt-2 text-sm text-foreground-600 max-w-sm">
            A clear, well-lit full or half-body photo works best. JPG or PNG under 12MB.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="mt-6 inline-flex items-center gap-2 h-11 px-6 rounded-md bg-foreground-950 text-background-50 text-sm font-semibold hover:bg-foreground-800 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
          >
            <i className="ri-attachment-2"></i>
            Choose a photo
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-accent-600 inline-flex items-center gap-1.5">
          <i className="ri-error-warning-line"></i>
          {error}
        </p>
      )}
    </div>
  );
}