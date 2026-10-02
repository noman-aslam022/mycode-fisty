import { useRef, useState, type DragEvent } from "react";
import { fileToDownscaledDataUrl, MAX_UPLOAD_BYTES } from "../utils/image";
import type { ImportedGarment } from "../types";

interface GarmentImportProps {
  onImport: (garment: ImportedGarment) => void;
}

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `g-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

function nameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const last = path.split("/").filter(Boolean).pop() || "";
    const cleaned = decodeURIComponent(last)
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[-_]+/g, " ")
      .trim();
    return cleaned ? cleaned.slice(0, 40) : "Imported piece";
  } catch {
    return "Imported piece";
  }
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "External";
  }
}

export default function GarmentImport({ onImport }: GarmentImportProps) {
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const acceptUrl = (raw: string, originOverride?: string) => {
    const cleaned = raw.trim();
    if (!/^https?:\/\//i.test(cleaned)) {
      setError("That doesn't look like an image link — it should start with http:// or https://");
      return;
    }
    onImport({
      id: makeId(),
      name: nameFromUrl(cleaned),
      source: cleaned,
      origin: originOverride ?? hostFromUrl(cleaned),
    });
    setUrl("");
    setError("");
  };

  const acceptFile = async (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please drop an image file (JPG or PNG).");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That file is a bit large — please use one under 12MB.");
      return;
    }
    setLoading(true);
    try {
      const dataUrl = await fileToDownscaledDataUrl(file);
      onImport({
        id: makeId(),
        name:
          file.name.replace(/\.[a-z0-9]+$/i, "").trim().slice(0, 40) || "Imported piece",
        source: dataUrl,
        origin: "Uploaded",
      });
    } catch {
      setError("Could not read that image. Try another file.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    const imageFile = files.find((f) => f.type.startsWith("image/"));
    if (imageFile) {
      void acceptFile(imageFile);
      return;
    }

    const uriList = e.dataTransfer.getData("text/uri-list");
    const plain = e.dataTransfer.getData("text/plain");
    const html = e.dataTransfer.getData("text/html");

    let candidate = "";
    if (uriList) {
      candidate = uriList.split(/\r?\n/).find((line) => line && !line.startsWith("#")) || "";
    }
    if (!candidate) candidate = plain;
    if (!candidate && html) {
      const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (match) candidate = match[1];
    }

    if (candidate && /^https?:\/\//i.test(candidate)) {
      acceptUrl(candidate);
      return;
    }

    setError(
      "Couldn't read that image. Tip: right-click the product photo, copy its image link, then paste it below."
    );
  };

  return (
    <div className="rounded-2xl bg-background-50 border border-background-200 p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-9 h-9 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center">
          <i className="ri-magic-line text-lg"></i>
        </span>
        <div>
          <p className="font-heading font-bold text-foreground-950 leading-tight">
            Add from any site
          </p>
          <p className="text-xs text-foreground-500">Found a piece elsewhere? Bring it in.</p>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex-1 min-h-[132px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center px-5 py-6 transition-colors ${
          dragging ? "border-accent-500 bg-accent-100/60" : "border-background-300"
        }`}
      >
        <span className="w-12 h-12 rounded-full bg-background-100 flex items-center justify-center mb-3">
          <i
            className={`text-2xl text-foreground-600 ${
              loading ? "ri-loader-4-line animate-spin" : "ri-drag-drop-line"
            }`}
          ></i>
        </span>
        <p className="text-sm font-medium text-foreground-800">
          Drag a product image here from another website
        </p>
        <p className="text-xs text-foreground-500 mt-1">
          Or{" "}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="underline underline-offset-2 hover:text-foreground-800 cursor-pointer"
          >
            upload a file
          </button>{" "}
          from your device
        </p>
      </div>

      <div className="flex items-center gap-3 my-4">
        <span className="h-px flex-1 bg-background-200"></span>
        <span className="font-label text-[10px] uppercase tracking-[0.18em] text-foreground-400">
          or paste a link
        </span>
        <span className="h-px flex-1 bg-background-200"></span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <i className="ri-link absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                acceptUrl(url);
              }
            }}
            placeholder="https://shop.example.com/jacket.jpg"
            className="w-full h-11 pl-9 pr-3 rounded-xl bg-background-100 border border-background-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-accent-300"
          />
        </div>
        <button
          type="button"
          onClick={() => acceptUrl(url)}
          disabled={!url.trim() || loading}
          className="h-11 px-5 rounded-xl bg-foreground-950 text-background-50 text-sm font-medium hover:bg-foreground-800 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add image
        </button>
      </div>

      {error && (
        <p className="mt-3 text-xs text-accent-600 flex items-start gap-1.5">
          <i className="ri-error-warning-line mt-0.5"></i>
          <span>{error}</span>
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void acceptFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}