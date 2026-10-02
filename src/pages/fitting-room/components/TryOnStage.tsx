import { useState } from "react";
import type { OutfitEntry, TryOnStatus } from "../types";
import { entryName, entrySource, SLOT_META } from "../utils/outfit";

interface TryOnStageProps {
  photo: string | null;
  entries: OutfitEntry[];
  status: TryOnStatus;
  resultUrl: string | null;
  error: string;
  progress: string;
  onRetry: () => void;
  onShopLook: () => void;
}

function FrameCorner({ className }: { className: string }) {
  return <span className={`pointer-events-none absolute w-6 h-6 md:w-8 md:h-8 ${className}`}></span>;
}

export default function TryOnStage({
  photo,
  entries,
  status,
  resultUrl,
  error,
  progress,
  onRetry,
  onShopLook,
}: TryOnStageProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const count = entries.length;
  const busy = status === "generating";
  const label =
    count === 0 ? "your look" : count === 1 ? "your piece" : `your ${count}-piece look`;

  const isDone = status === "done" && Boolean(resultUrl);

  return (
    <div className="h-full rounded-3xl bg-background-50 p-5 md:p-6 flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="inline-flex items-center gap-2 font-label text-[11px] uppercase tracking-[0.16em] text-foreground-500">
          <span className="w-6 h-6 rounded-full bg-foreground-950 text-background-50 flex items-center justify-center text-[10px] font-bold">
            02
          </span>
          The stage
        </span>
        {isDone ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOriginal((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background-200 hover:bg-background-300 text-foreground-950 text-xs font-label uppercase tracking-[0.12em] transition-colors cursor-pointer"
            >
              <i className={showOriginal ? "ri-sparkling-fill" : "ri-user-line"}></i>
              {showOriginal ? "Show Fitted" : "Show Original"}
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500 text-foreground-950 text-xs font-label uppercase tracking-[0.12em] font-bold">
              <i className="ri-sparkling-2-fill"></i> On you · AI
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-100 text-secondary-900 text-[10px] font-label uppercase tracking-[0.12em]">
            <i className="ri-lock-line"></i> Face &amp; body locked
          </span>
        )}
      </div>

      <div className="relative flex-1 w-full aspect-[4/5] md:aspect-[16/12] rounded-2xl overflow-hidden bg-foreground-950">
        {photo && (
          <img
            src={photo}
            alt="Your photo"
            title="Your photo"
            className={`absolute inset-0 w-full h-full object-contain transition-all duration-700 ${
              busy ? "blur-lg brightness-50 scale-105" : ""
            } ${isDone && !showOriginal ? "opacity-0" : "opacity-100"}`}
          />
        )}

        {!photo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <span className="w-20 h-20 rounded-full bg-background-50/10 flex items-center justify-center mb-5">
              <i className="ri-user-add-line text-4xl text-background-50"></i>
            </span>
            <p className="font-heading font-bold text-xl text-background-50">
              Your stage is empty
            </p>
            <p className="text-sm text-background-200/60 mt-2 max-w-xs">
              Add your photo on the left, then build a look and hit &ldquo;Fit the look&rdquo;.
            </p>
          </div>
        )}

        {resultUrl && (
          <img
            key={resultUrl}
            src={resultUrl}
            alt={count > 0 ? `Try-on of ${label}` : "Your AI try-on"}
            title={count > 0 ? `${count} piece try-on — on you` : "AI try-on"}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${
              isDone && !showOriginal ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
        )}

        {/* Viewfinder brackets */}
        <FrameCorner className="left-3 top-3 border-l-2 border-t-2 border-background-50/40 rounded-tl-lg" />
        <FrameCorner className="right-3 top-3 border-r-2 border-t-2 border-background-50/40 rounded-tr-lg" />
        <FrameCorner className="left-3 bottom-3 border-l-2 border-b-2 border-background-50/40 rounded-bl-lg" />
        <FrameCorner className="right-3 bottom-3 border-r-2 border-b-2 border-background-50/40 rounded-br-lg" />

        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground-950/60">
            <span className="w-16 h-16 rounded-full border-4 border-primary-500/30 border-t-primary-500 animate-spin mb-4"></span>
            <p className="font-heading font-bold text-background-50 text-center px-6">
              Fitting {label}…
            </p>
            <p className="text-xs text-background-200/60 mt-1 text-center px-6">
              {progress || "Bria is compositing onto you"}
            </p>
          </div>
        )}

        {status === "error" && !resultUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground-950/85 text-center px-6">
            <i className="ri-error-warning-line text-4xl text-accent-400 mb-3"></i>
            <p className="font-heading font-bold text-background-50">That didn&apos;t work</p>
            <p className="text-sm text-background-200/60 mt-1 mb-4 max-w-xs">
              {error || "Please try again."}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary-500 text-foreground-950 font-medium hover:bg-primary-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-refresh-line"></i> Try again
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {count > 0 ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-background-100 border border-background-200 p-3">
            <div className="flex flex-wrap gap-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="relative w-11 h-14 rounded-lg overflow-hidden bg-background-200 border border-background-200"
                  title={entryName(entry)}
                >
                  <img
                    src={entrySource(entry)}
                    alt={entryName(entry)}
                    title={entryName(entry)}
                    className="w-full h-full object-cover object-top"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-foreground-950/75 text-background-50 text-[8px] font-label uppercase tracking-[0.08em] text-center py-0.5">
                    {SLOT_META[entry.slot].short}
                  </span>
                </div>
              ))}
            </div>
            <p className="flex-1 min-w-[120px] text-sm text-foreground-700">
              <span className="font-heading font-bold text-foreground-950">
                {count} {count === 1 ? "piece" : "pieces"}
              </span>{" "}
              in your look
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={onShopLook}
              className="shrink-0 inline-flex items-center gap-2 h-10 px-5 rounded-full bg-accent-500 text-background-50 text-sm font-medium hover:bg-accent-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="ri-shopping-bag-3-line"></i> Shop the look
            </button>
          </div>
        ) : (
          <p className="text-sm text-foreground-500 text-center py-2">
            Pick a piece below to start building your look.
          </p>
        )}
        {error && status !== "error" && <p className="text-sm text-accent-600">{error}</p>}
      </div>
    </div>
  );
}