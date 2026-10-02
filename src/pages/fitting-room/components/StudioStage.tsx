import type { FitEngine } from "@/pages/fitting-room/utils/tryOn";
import type { StudioGarment } from "@/pages/fitting-room/utils/wardrobe";

interface StudioStageProps {
  photo: string;
  selected: StudioGarment[];
  status: "idle" | "generating" | "done" | "error";
  progress: string;
  /** The fitted result. While null the original photo is shown. */
  result?: string | null;
  engine?: FitEngine | null;
  /** Why the AI engine handed over to the local studio engine, if it did. */
  engineNote?: string;
  error?: string;
  showOriginal?: boolean;
  onToggleOriginal?: () => void;
  onRetry?: () => void;
  expandable?: boolean;
  onExpand?: () => void;
}

export default function StudioStage({
  photo,
  selected,
  status,
  progress,
  result,
  engine,
  engineNote,
  error,
  showOriginal = false,
  onToggleOriginal,
  onRetry,
  expandable = false,
  onExpand,
}: StudioStageProps) {
  const canExpand = expandable && status === "done";
  const showingResult = Boolean(result) && !showOriginal;
  const source = showingResult ? (result as string) : photo;

  return (
    <div
      className="relative rounded-lg border border-background-200 bg-background-100 overflow-hidden lg:h-full"
      aria-busy={status === "generating"}
    >
      <div
        onClick={canExpand ? onExpand : undefined}
        role={canExpand ? "button" : undefined}
        aria-label={canExpand ? "Enlarge your look preview" : undefined}
        className={`relative w-full aspect-[3/4] sm:aspect-[4/5] lg:aspect-auto lg:h-full ${
          canExpand ? "cursor-zoom-in group" : ""
        }`}
      >
        <img
          src={source}
          alt={
            showingResult
              ? "Your fitted look in the Fitsy fitting room"
              : "Your photo in the Fitsy fitting room"
          }
          title={showingResult ? "Your fitted look" : "Your original photo"}
          className="w-full h-full object-contain object-center animate-fade-in"
        />

        <span className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground-950/80 backdrop-blur text-background-50 text-[11px] font-label uppercase tracking-[0.16em]">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          {status === "generating"
            ? "Working"
            : showingResult
              ? engine === "ai"
                ? "AI try-on"
                : "Studio preview"
              : "Original photo"}
        </span>

        {result && status !== "generating" && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {status === "done" && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500 text-foreground-950 text-xs font-semibold animate-pop">
                <i className="ri-checkbox-circle-fill"></i>
                Look ready
              </span>
            )}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleOriginal?.();
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background-50/90 backdrop-blur text-foreground-950 text-[11px] font-semibold hover:bg-background-50 transition-colors cursor-pointer"
            >
              <i className={showingResult ? "ri-image-line" : "ri-magic-line"}></i>
              {showingResult ? "See original" : "See try-on"}
            </button>
            {canExpand && (
              <button
                type="button"
                aria-label="Enlarge your look preview"
                onClick={(event) => {
                  event.stopPropagation();
                  onExpand?.();
                }}
                className="w-9 h-9 rounded-full bg-background-50/90 backdrop-blur text-foreground-950 flex items-center justify-center hover:bg-background-50 hover:scale-105 transition-all cursor-pointer animate-pop"
              >
                <i className="ri-expand-diagonal-line"></i>
              </button>
            )}
          </div>
        )}

        {selected.length > 0 && status !== "generating" && !error && (
          <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 bg-gradient-to-t from-foreground-950/85 via-foreground-950/40 to-transparent">
            <p className="text-[11px] font-label uppercase tracking-[0.16em] text-background-200/80 mb-2">
              On your look · {selected.length}
            </p>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {selected.map((item, index) => (
                <span
                  key={item.id}
                  className="shrink-0 w-12 h-12 rounded-md overflow-hidden border border-background-50/30 bg-background-100 animate-pop"
                  style={{ animationDelay: `${Math.min(index * 55, 280)}ms` }}
                  title={item.name}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-top"
                  />
                </span>
              ))}
            </div>
          </div>
        )}

        {status === "generating" && (
          <div className="absolute inset-0 bg-foreground-950/75 backdrop-blur-sm flex flex-col items-center justify-center text-center px-6">
            <span className="w-14 h-14 rounded-full border-2 border-background-50/20 border-t-primary-500 animate-spin"></span>
            <p className="mt-5 font-heading font-semibold text-background-50">Styling your look…</p>
            <p className="mt-1 text-sm text-background-300/80" role="status" aria-live="polite">
              {progress}
            </p>
          </div>
        )}

        {status === "error" && error && (
          <div className="absolute inset-0 bg-foreground-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center px-6">
            <span className="w-12 h-12 rounded-full bg-accent-500/20 text-accent-500 flex items-center justify-center">
              <i className="ri-error-warning-line text-2xl"></i>
            </span>
            <p className="mt-4 font-heading font-semibold text-background-50 text-center">
              We couldn&apos;t fit that
            </p>
            <p className="mt-1.5 text-sm text-background-300/90 text-center max-w-sm">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRetry();
                }}
                className="mt-5 inline-flex items-center gap-2 h-10 px-5 rounded-full bg-primary-500 text-foreground-950 text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer"
              >
                <i className="ri-refresh-line"></i> Try again
              </button>
            )}
          </div>
        )}

        {engine === "studio" && engineNote && status === "done" && (
          <p className="absolute top-14 left-4 max-w-[15rem] text-[11px] leading-snug text-background-100/90 bg-foreground-950/70 backdrop-blur rounded-md px-3 py-2">
            <i className="ri-information-line mr-1"></i>
            {engineNote}
          </p>
        )}

        {canExpand && (
          <span className="absolute bottom-3 right-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background-50/90 backdrop-blur text-foreground-800 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <i className="ri-zoom-in-line"></i>
            Click to enlarge
          </span>
        )}
      </div>
    </div>
  );
}
