import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import type { Product, ProductAgeGroup, ProductAudience } from "@/mocks/products";
import { fileToDownscaledDataUrl, fetchImageAsDataUrl, MAX_UPLOAD_BYTES } from "@/pages/fitting-room/utils/image";
import { buildGarmentReference } from "@/pages/fitting-room/utils/garmentExtract";
import { makeProductId } from "@/pages/fitting-room/utils/catalogStore";
import { CATEGORY_DEFS, SLOT_META, colorName } from "@/pages/fitting-room/utils/outfit";
import type { OutfitSlot } from "@/pages/fitting-room/types";

interface ProductFormProps {
  editing: Product | null;
  onSave: (product: Product) => Promise<void>;
  onCancel: () => void;
}

const PALETTE = [
  "#3a3a34",
  "#efe8d8",
  "#c9d39b",
  "#b4571f",
  "#8a7f5c",
  "#4a5a72",
  "#c9cdd3",
  "#c9a227",
];

interface Choice {
  value: string;
  label: string;
  hint: string;
  icon: string;
}

const GENDER_OPTIONS: (Choice & { value: ProductAudience })[] = [
  { value: "unisex", label: "All / Unisex", hint: "Every rack", icon: "ri-sparkling-line" },
  { value: "women", label: "Women", hint: "Women's racks", icon: "ri-women-line" },
  { value: "men", label: "Men", hint: "Men's racks", icon: "ri-men-line" },
];

const GENERATION_OPTIONS: (Choice & { value: Exclude<ProductAgeGroup, "all"> })[] = [
  { value: "kids", label: "Kids & Youth", hint: "Ages 4–15", icon: "ri-baby-line" },
  { value: "adults", label: "Adults & Teens", hint: "Ages 16–50", icon: "ri-user-line" },
  { value: "seniors", label: "Classic & Mature", hint: "Ages 50+", icon: "ri-crown-line" },
];

export default function ProductForm({ editing, onSave, onCancel }: ProductFormProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryKey, setCategoryKey] = useState<string>(CATEGORY_DEFS[0].label);
  const [audience, setAudience] = useState<ProductAudience>("unisex");
  const [ageGroups, setAgeGroups] = useState<ProductAgeGroup[]>([]);
  const [colors, setColors] = useState<string[]>([PALETTE[0]]);

  const currentCategory =
    CATEGORY_DEFS.find((c) => c.label === categoryKey) ?? CATEGORY_DEFS[0];
  // The category preset IS the fitting slot — they can never disagree.
  const slot: OutfitSlot = currentCategory.slot;
  const [photo, setPhoto] = useState("");
  const [garmentRef, setGarmentRef] = useState("");
  const [detected, setDetected] = useState<boolean | null>(null);
  const [detectionAvailable, setDetectionAvailable] = useState(true);
  const [override, setOverride] = useState<boolean | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const effectiveOnModel = override ?? detected ?? false;

  // Hydrate the form whenever we switch between "new" and editing an item.
  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setPrice(String(editing.price));
      const matched =
        CATEGORY_DEFS.find(
          (c) => c.label.toLowerCase() === (editing.category || "").toLowerCase()
        ) ?? CATEGORY_DEFS.find((c) => c.slot === editing.slot);
      setCategoryKey(matched?.label ?? CATEGORY_DEFS[0].label);
      setAudience(editing.audience ?? "unisex");
      setAgeGroups(
        editing.ageGroups?.length
          ? editing.ageGroups
          : editing.ageGroup
            ? [editing.ageGroup]
            : []
      );
      setColors(editing.colors.length ? editing.colors : [PALETTE[0]]);
      setPhoto(editing.image);
      setGarmentRef(editing.garmentRef ?? editing.image);
      setDetected(editing.onModel ?? null);
      setOverride(null);
    } else {
      setName("");
      setPrice("");
      setCategoryKey(CATEGORY_DEFS[0].label);
      setAudience("unisex");
      setAgeGroups([]);
      setColors([PALETTE[0]]);
      setPhoto("");
      setGarmentRef("");
      setDetected(null);
      setOverride(null);
    }
    setError("");
    setUrlValue("");
  }, [editing]);

  const runBuild = useCallback(
    async (src: string, nextSlot: OutfitSlot, force: boolean) => {
      setAnalyzing(true);
      try {
        const result = await buildGarmentReference(src, nextSlot, force);
        setDetectionAvailable(result.detectionAvailable);
        setGarmentRef(result.reference);
        if (!force) setDetected(result.onModel);
      } catch {
        setDetectionAvailable(false);
        setGarmentRef(src);
      } finally {
        setAnalyzing(false);
      }
    },
    []
  );

  // Auto-tag every time the photo or category changes.
  useEffect(() => {
    if (!photo) {
      setGarmentRef("");
      setDetected(null);
      return;
    }
    setOverride(null);
    void runBuild(photo, slot, false);
  }, [photo, slot, runBuild]);

  const toggleOnModel = (next: boolean) => {
    setOverride(next);
    if (photo) void runBuild(photo, slot, next);
  };

  const acceptFile = async (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose a JPG or PNG image.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That image is a bit large — please use one under 12MB.");
      return;
    }
    try {
      const dataUrl = await fileToDownscaledDataUrl(file);
      setPhoto(dataUrl);
    } catch {
      setError("Could not read that image. Try another file.");
    }
  };

  const acceptUrl = async () => {
    const cleaned = urlValue.trim();
    if (!/^https?:\/\//i.test(cleaned)) {
      setError("Paste a full image link starting with http:// or https://");
      return;
    }
    setError("");
    setLoadingUrl(true);
    try {
      const dataUrl = await fetchImageAsDataUrl(cleaned);
      setPhoto(dataUrl);
      setUrlValue("");
    } catch {
      setError("Couldn't download that image link. Try uploading the file instead.");
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = Array.from(e.dataTransfer.files || []).find((f) =>
      f.type.startsWith("image/")
    );
    if (file) void acceptFile(file);
    else setError("Drop an image file (JPG or PNG) to use it.");
  };

  const toggleColor = (hex: string) => {
    setColors((prev) => {
      if (prev.includes(hex)) {
        return prev.length > 1 ? prev.filter((c) => c !== hex) : prev;
      }
      return [...prev, hex];
    });
  };

  const toggleAgeGroup = (value: Exclude<ProductAgeGroup, "all">) => {
    setAgeGroups((prev) =>
      prev.includes(value) ? prev.filter((stage) => stage !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) {
      setError("Give the piece a name.");
      return;
    }
    if (!photo) {
      setError("Add a product photo.");
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError("Enter a valid price.");
      return;
    }
    const category = currentCategory.label;
    const product: Product = {
      id: editing?.id ?? makeProductId(),
      name: name.trim(),
      price: Math.round(priceNum * 100) / 100,
      category,
      slot,
      tags: name
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 8),
      colors,
      rating: editing?.rating ?? 0,
      reviews: editing?.reviews ?? 0,
      badge: editing?.badge,
      audience,
      ageGroups,
      image: photo,
      source: "user",
      onModel: effectiveOnModel,
      garmentRef: garmentRef || photo,
      createdAt: editing?.createdAt,
    };
    setSaving(true);
    try {
      await onSave(product);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl bg-background-50 border border-background-200 p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-primary-500 text-foreground-950 flex items-center justify-center">
            <i className={editing ? "ri-edit-2-line" : "ri-add-circle-line"}></i>
          </span>
          <div>
            <p className="font-heading font-bold text-foreground-950 leading-tight">
              {editing ? "Edit piece" : "Add a piece"}
            </p>
            <p className="text-xs text-foreground-500">Name, price, category and photo.</p>
          </div>
        </div>
        {editing && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-foreground-500 hover:text-foreground-950 transition-colors cursor-pointer"
          >
            Cancel edit
          </button>
        )}
      </div>

      {/* Photo */}
      <div className="mb-5">
        <label className="font-label text-[11px] uppercase tracking-[0.16em] text-foreground-500">
          Product photo
        </label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`mt-2 relative w-full aspect-[4/5] rounded-2xl overflow-hidden border-2 border-dashed transition-colors ${
            dragging ? "border-primary-500 bg-primary-100/40" : "border-background-300 bg-background-100"
          }`}
        >
          {photo ? (
            <>
              <img
                src={photo}
                alt="Product preview"
                title="Product preview"
                className="w-full h-full object-contain object-top"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-3 right-3 h-9 px-4 rounded-full bg-foreground-950 text-background-50 text-sm font-medium hover:bg-foreground-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-refresh-line mr-1.5"></i> Replace
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 cursor-pointer group"
            >
              <span className="w-14 h-14 rounded-full bg-background-200 group-hover:bg-primary-500 transition-colors flex items-center justify-center mb-3">
                <i className="ri-image-add-line text-2xl text-foreground-800 group-hover:text-foreground-950"></i>
              </span>
              <p className="font-heading font-bold text-foreground-950">
                Drop a photo or click to upload
              </p>
              <p className="text-xs text-foreground-500 mt-1">
                JPG or PNG. Flat or on-model both work.
              </p>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <div className="relative flex-1">
            <i className="ri-link absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void acceptUrl();
                }
              }}
              placeholder="…or paste an image link"
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-background-100 border border-background-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <button
            type="button"
            onClick={() => void acceptUrl()}
            disabled={!urlValue.trim() || loadingUrl}
            className="h-10 px-4 rounded-xl bg-background-950 text-background-50 text-sm font-medium hover:bg-background-900 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loadingUrl ? "Fetching…" : "Use link"}
          </button>
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

      {/* Auto-tag status */}
      {photo && (
        <div className="mb-5 rounded-2xl border border-background-200 bg-background-100 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  effectiveOnModel
                    ? "bg-secondary-100 text-secondary-900"
                    : "bg-background-200 text-foreground-700"
                }`}
              >
                <i
                  className={
                    analyzing
                      ? "ri-loader-4-line animate-spin"
                      : effectiveOnModel
                        ? "ri-user-star-line"
                        : "ri-image-line"
                  }
                ></i>
              </span>
              <div>
                <p className="text-sm font-medium text-foreground-900">
                  {effectiveOnModel ? "On-model shot — garment will be isolated" : "Clean product shot"}
                </p>
                <p className="text-xs text-foreground-500 mt-0.5">
                  {!detectionAvailable && !override
                    ? "Auto-detect couldn't read this photo. If a model is wearing it, switch this on."
                    : effectiveOnModel
                      ? "We crop just the garment (no face or body) before the try-on."
                      : "Used exactly as-is — no person to remove."}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={effectiveOnModel}
              onClick={() => toggleOnModel(!effectiveOnModel)}
              className={`shrink-0 relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                effectiveOnModel ? "bg-primary-500" : "bg-background-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-background-50 transition-all ${
                  effectiveOnModel ? "left-[22px]" : "left-0.5"
                }`}
              ></span>
            </button>
          </div>

          {effectiveOnModel && garmentRef && garmentRef !== photo && (
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-background-50 border border-background-200 p-2.5">
              <div className="w-12 h-14 rounded-lg overflow-hidden bg-background-200 shrink-0">
                <img
                  src={garmentRef}
                  alt="Isolated garment reference"
                  title="Isolated garment"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-label uppercase tracking-[0.14em] text-foreground-500">
                  Clean reference
                </p>
                <p className="text-xs text-foreground-600">
                  This human-free cut-out is what the try-on engine receives.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Name + price */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="sm:col-span-2">
          <label className="font-label text-[11px] uppercase tracking-[0.16em] text-foreground-500">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Oversized Wool Coat"
            className="mt-2 w-full h-11 px-3 rounded-xl bg-background-100 border border-background-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div>
          <label className="font-label text-[11px] uppercase tracking-[0.16em] text-foreground-500">
            Price
          </label>
          <div className="relative mt-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm">
              $
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="w-full h-11 pl-7 pr-3 rounded-xl bg-background-100 border border-background-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
        </div>
      </div>

      {/* Category Preset — this is also what decides the fitting slot */}
      <div className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="font-label text-[11px] uppercase tracking-[0.16em] text-foreground-500">
            Category Preset
          </label>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-foreground-500">
            <i className="ri-hanger-line"></i>
            Hangs on
            <span className="font-semibold text-foreground-800">
              {SLOT_META[currentCategory.slot].label}
            </span>
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORY_DEFS.map((c) => {
            const active = categoryKey === c.label;
            return (
              <button
                key={c.label}
                type="button"
                aria-pressed={active}
                onClick={() => setCategoryKey(c.label)}
                className={`text-left rounded-xl border p-3 transition-colors cursor-pointer ${
                  active
                    ? "border-primary-500 bg-primary-100/50"
                    : "border-background-200 bg-background-100 hover:border-foreground-300"
                }`}
              >
                <i className={`${c.icon} text-lg ${active ? "text-primary-700" : "text-foreground-600"}`}></i>
                <p className="mt-1.5 font-heading font-bold text-sm text-foreground-950">{c.label}</p>
                <p className="text-[11px] text-foreground-500 leading-tight">{c.hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Gender — checkbox style */}
      <div className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="font-label text-[11px] uppercase tracking-[0.16em] text-foreground-500">
            Target Gender
          </label>
          <span className="text-[11px] text-foreground-500">
            Who sees this piece on their racks
          </span>
        </div>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {GENDER_OPTIONS.map((option) => {
            const active = audience === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="checkbox"
                aria-checked={active}
                onClick={() => setAudience(option.value)}
                className={`flex items-center gap-2.5 text-left rounded-xl border p-3 transition-colors cursor-pointer ${
                  active
                    ? "border-primary-500 bg-primary-100/50"
                    : "border-background-200 bg-background-100 hover:border-foreground-300"
                }`}
              >
                <span
                  className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center transition-colors ${
                    active
                      ? "bg-primary-500 border-primary-500 text-foreground-950"
                      : "bg-background-50 border-background-300 text-transparent"
                  }`}
                >
                  <i className="ri-check-line text-sm"></i>
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <i
                      className={`${option.icon} text-base ${
                        active ? "text-primary-700" : "text-foreground-600"
                      }`}
                    ></i>
                    <span className="font-heading font-bold text-sm text-foreground-950">
                      {option.label}
                    </span>
                  </span>
                  <span className="block text-[11px] text-foreground-500 leading-tight mt-0.5">
                    {option.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generation / Stage — same card grid as the category preset */}
      <div className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="font-label text-[11px] uppercase tracking-[0.16em] text-foreground-500">
            Generation / Stage
          </label>
          <span className="text-[11px] text-foreground-500">
            {ageGroups.length === 0
              ? "Showing on every age rack"
              : `${ageGroups.length} selected`}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            aria-pressed={ageGroups.length === 0}
            onClick={() => setAgeGroups([])}
            className={`text-left rounded-xl border p-3 transition-colors cursor-pointer ${
              ageGroups.length === 0
                ? "border-primary-500 bg-primary-100/50"
                : "border-background-200 bg-background-100 hover:border-foreground-300"
            }`}
          >
            <i
              className={`ri-sparkling-line text-lg ${
                ageGroups.length === 0 ? "text-primary-700" : "text-foreground-600"
              }`}
            ></i>
            <p className="mt-1.5 font-heading font-bold text-sm text-foreground-950">
              All Generations
            </p>
            <p className="text-[11px] text-foreground-500 leading-tight">No age filtering</p>
          </button>

          {GENERATION_OPTIONS.map((option) => {
            const active = ageGroups.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleAgeGroup(option.value)}
                className={`text-left rounded-xl border p-3 transition-colors cursor-pointer ${
                  active
                    ? "border-primary-500 bg-primary-100/50"
                    : "border-background-200 bg-background-100 hover:border-foreground-300"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <i
                    className={`${option.icon} text-lg ${
                      active ? "text-primary-700" : "text-foreground-600"
                    }`}
                  ></i>
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      active
                        ? "bg-primary-500 border-primary-500 text-foreground-950"
                        : "bg-background-50 border-background-300 text-transparent"
                    }`}
                  >
                    <i className="ri-check-line text-[11px]"></i>
                  </span>
                </span>
                <p className="mt-1.5 font-heading font-bold text-sm text-foreground-950">
                  {option.label}
                </p>
                <p className="text-[11px] text-foreground-500 leading-tight">{option.hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div className="mb-5">
        <label className="font-label text-[11px] uppercase tracking-[0.16em] text-foreground-500">
          Colours ({colors.length})
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-2.5">
          {PALETTE.map((hex) => {
            const active = colors.includes(hex);
            return (
              <button
                key={hex}
                type="button"
                onClick={() => toggleColor(hex)}
                aria-label={`Toggle ${colorName(hex)}`}
                title={colorName(hex)}
                aria-pressed={active}
                className={`w-8 h-8 rounded-full border transition-all cursor-pointer ${
                  active
                    ? "border-foreground-950 ring-2 ring-offset-2 ring-foreground-950/20"
                    : "border-background-300 hover:border-foreground-400"
                }`}
                style={{ backgroundColor: hex }}
              ></button>
            );
          })}
          <span className="text-xs text-foreground-500">Tap to include the shades you offer.</span>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-accent-600 flex items-start gap-1.5">
          <i className="ri-error-warning-line mt-0.5"></i>
          <span>{error}</span>
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={saving || analyzing}
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-primary-500 text-foreground-950 font-heading font-bold hover:bg-primary-400 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <i className="ri-loader-4-line animate-spin"></i> Saving…
            </>
          ) : (
            <>
              <i className={editing ? "ri-save-line" : "ri-add-line"}></i>
              {editing ? "Save changes" : "Add to catalog"}
            </>
          )}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onCancel}
            className="h-12 px-6 rounded-xl bg-background-100 border border-background-200 text-foreground-800 font-medium hover:border-foreground-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}