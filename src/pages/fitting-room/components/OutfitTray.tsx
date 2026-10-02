import { useState } from "react";
import type { ImportedGarment, OutfitEntry, OutfitSlot } from "../types";
import {
  categoryIcon,
  colorName,
  entryName,
  entrySubtitle,
  entrySource,
  SLOT_META,
  sortLook,
} from "../utils/outfit";
import GarmentImport from "./GarmentImport";

interface OutfitTrayProps {
  look: OutfitEntry[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onImport: (garment: ImportedGarment, slot: OutfitSlot) => void;
  onFit: () => void;
  onShopLook: () => void;
  busy: boolean;
  hasPhoto: boolean;
  count: number;
  batches: number;
}

function Thumb({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <span className="w-full h-full flex items-center justify-center text-foreground-400">
        <i className="ri-image-line text-2xl"></i>
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      title={alt}
      onError={() => setOk(false)}
      className="w-full h-full object-cover object-top"
    />
  );
}

function PieceCard({ entry, onRemove }: { entry: OutfitEntry; onRemove: () => void }) {
  const badgeLabel =
    entry.kind === "catalog" ? entry.product.category : SLOT_META[entry.slot].short;
  const badgeIcon =
    entry.kind === "catalog" ? categoryIcon(entry.product.category) : SLOT_META[entry.slot].icon;
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-background-200 bg-background-50 p-3">
      <div className="w-14 h-16 rounded-xl overflow-hidden bg-background-100 shrink-0">
        <Thumb src={entrySource(entry)} alt={entryName(entry)} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-900 text-[10px] font-label uppercase tracking-[0.12em]">
          <i className={badgeIcon}></i> {badgeLabel}
        </span>
        <p className="mt-1 font-heading font-bold text-sm text-foreground-950 truncate">
          {entryName(entry)}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-foreground-500">
          {entry.kind === "catalog" && (
            <>
              <span
                className="w-3 h-3 rounded-full border border-background-300 shrink-0"
                style={{ backgroundColor: entry.color }}
              ></span>
              <span className="truncate">{colorName(entry.color)}</span>
              <span className="text-foreground-300">·</span>
            </>
          )}
          <span className="truncate">{entrySubtitle(entry)}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${entryName(entry)}`}
        className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-foreground-400 hover:text-foreground-900 hover:bg-background-100 transition-colors cursor-pointer"
      >
        <i className="ri-close-line"></i>
      </button>
    </div>
  );
}

export default function OutfitTray({
  look,
  onRemove,
  onClearAll,
  onImport,
  onFit,
  onShopLook,
  busy,
  hasPhoto,
  count,
  batches,
}: OutfitTrayProps) {
  const canFit = hasPhoto && count > 0 && !busy;
  const ordered = sortLook(look);

  return (
    <section className="w-full px-4 md:px-6 lg:px-10 py-12 md:py-16 bg-background-100">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-2 font-label text-xs uppercase tracking-[0.22em] text-accent-700 mb-3">
            <i className="ri-stack-line"></i> Step 03 — The look
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-5xl tracking-tight text-foreground-950">
            Build the whole fit
          </h2>
          <p className="mt-3 text-sm md:text-base text-foreground-600 max-w-xl">
            One top, one bottom and a layer over it — plus as many accessories as you want
            (glasses, hats, jewellery, bags). Fit it all onto you in one go, then shop the look.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-50 border border-background-200 font-label text-xs uppercase tracking-[0.12em] text-foreground-700">
            {count} {count === 1 ? "piece" : "pieces"}
          </span>
          {count > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-foreground-500 hover:text-foreground-900 transition-colors cursor-pointer whitespace-nowrap"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        {count > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ordered.map((entry) => (
              <PieceCard key={entry.id} entry={entry} onRemove={() => onRemove(entry.id)} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-background-300 bg-background-50/60 p-8 text-center">
            <span className="w-12 h-12 rounded-full bg-background-200 flex items-center justify-center mx-auto mb-3">
              <i className="ri-add-line text-2xl text-foreground-500"></i>
            </span>
            <p className="font-heading font-bold text-foreground-950">Your look is empty</p>
            <p className="text-sm text-foreground-500 mt-1">
              Add pieces from the racks below, or import one from another site.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GarmentImport onImport={onImport} />
        </div>

        <div className="rounded-2xl bg-foreground-950 text-background-50 p-6 flex flex-col justify-between">
          <div>
            <span className="w-11 h-11 rounded-xl bg-background-50/10 flex items-center justify-center mb-4">
              <i className="ri-sparkling-2-fill text-xl text-primary-500"></i>
            </span>
            <p className="font-heading font-extrabold text-xl">Ready to fit?</p>
            <p className="text-sm text-background-200/70 mt-2 leading-relaxed">
              {count === 0
                ? "Add pieces to your look from the racks below, or import one from another site."
                : hasPhoto
                  ? `${count} ${count === 1 ? "piece" : "pieces"} ready — fit the full look and compare it with your original photo, then shop it in one tap.`
                  : "Nice look. Now add your photo so it can be fitted onto you."}
            </p>
            {count > 3 && hasPhoto && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-background-200/70">
                <i className="ri-loop-right-line text-primary-500"></i>
                Fitted in {batches} passes (3 pieces at a time, then the rest are layered on).
              </p>
            )}
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={onFit}
              disabled={!canFit}
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-primary-500 text-foreground-950 font-medium hover:bg-primary-400 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <i className={busy ? "ri-loader-4-line animate-spin" : "ri-magic-line"}></i>
              {busy ? "Fitting your look…" : count > 1 ? "Fit the full look" : "Fit the look"}
            </button>
            <button
              type="button"
              onClick={onShopLook}
              disabled={count === 0}
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full border border-background-50/20 text-background-50 font-medium hover:bg-background-50/10 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <i className="ri-shopping-bag-3-line"></i> Shop the look
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}