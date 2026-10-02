import { useRef, useState, type DragEvent } from "react";
import { fileToDownscaledDataUrl, MAX_UPLOAD_BYTES } from "../utils/image";
import type { ImportedGarment, OutfitSlot } from "../types";
import { SLOT_META } from "../utils/outfit";

interface GarmentImportProps {
  onImport: (garment: ImportedGarment, slot: OutfitSlot) => void;
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

const SLOT_OPTIONS: { id: OutfitSlot; label: string; icon: string; description: string }[] = [
  {
    id: "top",
    label: "Top",
    icon: "ri-t-shirt-line",
    description: "T-Shirts, Hoodies, Shirts, Polos, Sweaters",
  },
  {
    id: "bottom",
    label: "Bottom",
    icon: "ri-walk-line",
    description: "Pants, Jeans, Cargo, Shorts, Skirts",
  },
  {
    id: "layer",
    label: "Outerwear / Layer",
    icon: "ri-stack-line",
    description: "Jackets, Coats, Blazers, Shackets, Vests",
  },
  {
    id: "accessory",
    label: "Accessory",
    icon: "ri-vip-diamond-line",
    description: "Bags, Footwear, Hats, Sunglasses, Jewelry",
  },
];

export default function GarmentImport({ onImport }: GarmentImportProps) {
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Staged piece awaiting user's explicit slot selection
  const [stagedPiece, setStagedPiece] = useState<{
    id: string;
    name: string;
    source: string;
    origin: string;
    selectedSlot: OutfitSlot;
  } | null>(null);

  const startStaging = (source: string, initialName: string, origin: string) => {
    setStagedPiece({
      id: makeId(),
      name: initialName,
      source,
      origin,
      // Default to "top", but user explicitly chooses and can change before applying
      selectedSlot: "top",
    });
    setUrl("");
    setError("");
  };

  const acceptUrl = (raw: string, originOverride?: string) => {
    const cleaned = raw.trim();
    if (!/^https?:\/\//i.test(cleaned)) {
      setError("That doesn't look like an image link — it should start with http:// or https://");
      return;
    }
    startStaging(cleaned, nameFromUrl(cleaned), originOverride ?? hostFromUrl(cleaned));
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
      const name = file.name.replace(/\.[a-z0-9]+$/i, "").trim().slice(0, 40) || "Imported piece";
      startStaging(dataUrl, name, "Uploaded");
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

  const handleApplyStaged = () => {
    if (!stagedPiece) return;
    onImport(
      {
        id: stagedPiece.id,
        name: stagedPiece.name.trim() || "Custom piece",
        source: stagedPiece.source,
        origin: stagedPiece.origin,
        slot: stagedPiece.selectedSlot,
      },
      stagedPiece.selectedSlot
    );
    setStagedPiece(null);
  };

  return (
    <div className="rounded-2xl bg-background-50 border border-background-200 p-5 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center">
              <i className="ri-magic-line text-lg"></i>
            </span>
            <div>
              <p className="font-heading font-bold text-foreground-950 leading-tight">
                Import &amp; Hang Your Own Piece
              </p>
              <p className="text-xs text-foreground-500">
                Upload or paste any item from anywhere, choose its slot, and fit it!
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-accent-700 bg-accent-50 px-2.5 py-1 rounded-full border border-accent-200">
            <i className="ri-checkbox-circle-line"></i> Custom Slot Picker
          </span>
        </div>

        {/* If a piece is staged, show the Slot Picker and Details configuration */}
        {stagedPiece ? (
          <div className="rounded-2xl border-2 border-accent-500/80 bg-accent-50/40 p-4 sm:p-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-background-200/80 mb-4">
              <span className="font-label text-xs uppercase tracking-wider text-accent-800 font-bold flex items-center gap-1.5">
                <i className="ri-sound-module-line"></i> Configure Piece Placement
              </span>
              <button
                type="button"
                onClick={() => setStagedPiece(null)}
                className="text-xs text-foreground-500 hover:text-foreground-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Thumbnail */}
              <div className="sm:col-span-3 aspect-[3/4] max-h-36 rounded-xl overflow-hidden bg-background-100 border border-background-200 shrink-0">
                <img
                  src={stagedPiece.source}
                  alt={stagedPiece.name}
                  className="w-full h-full object-contain p-1"
                />
              </div>

              {/* Form Controls */}
              <div className="sm:col-span-9 space-y-3">
                {/* Piece Name */}
                <div>
                  <label className="block text-xs font-semibold text-foreground-800 mb-1">
                    Piece Name / Title
                  </label>
                  <input
                    type="text"
                    value={stagedPiece.name}
                    onChange={(e) =>
                      setStagedPiece({ ...stagedPiece, name: e.target.value })
                    }
                    placeholder="e.g. Vintage Leather Jacket, Oversized Tee..."
                    className="w-full h-10 px-3 rounded-xl bg-background-50 border border-background-300 text-sm text-foreground-900 focus:outline-none focus:ring-2 focus:ring-accent-400"
                  />
                </div>

                {/* Dropdown for Slot Placement */}
                <div>
                  <label className="block text-xs font-semibold text-foreground-800 mb-1 flex items-center justify-between">
                    <span>Select Fitting Slot / Placement:</span>
                    <span className="text-[11px] text-accent-700 font-normal">
                      No auto-tagging &bull; You decide
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={stagedPiece.selectedSlot}
                      onChange={(e) =>
                        setStagedPiece({
                          ...stagedPiece,
                          selectedSlot: e.target.value as OutfitSlot,
                        })
                      }
                      className="w-full h-11 pl-3 pr-8 rounded-xl bg-background-50 border-2 border-accent-300 text-sm font-medium text-foreground-950 focus:outline-none focus:ring-2 focus:ring-accent-400 cursor-pointer appearance-none"
                    >
                      {SLOT_OPTIONS.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {slot.label} &mdash; ({slot.description})
                        </option>
                      ))}
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-foreground-500 pointer-events-none text-lg"></i>
                  </div>
                  <p className="text-[11px] text-foreground-500 mt-1 flex items-center gap-1">
                    <i className="ri-information-line text-accent-600"></i>
                    {stagedPiece.selectedSlot === "top" && "Fills the torso (swaps out existing top)."}
                    {stagedPiece.selectedSlot === "bottom" && "Fills legs & waist (swaps out existing pants)."}
                    {stagedPiece.selectedSlot === "layer" && "Layers over your top (jackets, coats)."}
                    {stagedPiece.selectedSlot === "accessory" && "Accessories can stack unlimited (bags, hats, eyewear)."}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyStaged}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-accent-600 text-background-50 font-medium text-sm hover:bg-accent-700 transition-colors shadow-sm cursor-pointer"
                  >
                    <i className="ri-check-line text-base"></i>
                    <span>Apply to Look &amp; Hang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStagedPiece(null)}
                    className="h-11 px-4 rounded-xl border border-background-300 text-foreground-700 text-sm hover:bg-background-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Normal Drag & Drop / URL Input */
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`min-h-[120px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center px-4 py-5 transition-colors ${
                dragging ? "border-accent-500 bg-accent-100/60" : "border-background-300"
              }`}
            >
              <span className="w-10 h-10 rounded-full bg-background-100 flex items-center justify-center mb-2">
                <i
                  className={`text-xl text-foreground-600 ${
                    loading ? "ri-loader-4-line animate-spin" : "ri-drag-drop-line"
                  }`}
                ></i>
              </span>
              <p className="text-xs sm:text-sm font-medium text-foreground-800">
                Drag a product photo here from another website
              </p>
              <p className="text-xs text-foreground-500 mt-1">
                Or{" "}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="underline underline-offset-2 text-accent-700 font-semibold hover:text-accent-900 cursor-pointer"
                >
                  choose an image file
                </button>{" "}
                from your device
              </p>
            </div>

            <div className="flex items-center gap-3 my-3">
              <span className="h-px flex-1 bg-background-200"></span>
              <span className="font-label text-[10px] uppercase tracking-[0.18em] text-foreground-400">
                or paste image link
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
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-background-100 border border-background-200 text-xs sm:text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-accent-300"
                />
              </div>
              <button
                type="button"
                onClick={() => acceptUrl(url)}
                disabled={!url.trim() || loading}
                className="h-10 px-4 rounded-xl bg-foreground-950 text-background-50 text-xs sm:text-sm font-medium hover:bg-foreground-800 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add Piece
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="mt-3 text-xs text-accent-600 flex items-start gap-1.5">
            <i className="ri-error-warning-line mt-0.5"></i>
            <span>{error}</span>
          </p>
        )}
      </div>

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