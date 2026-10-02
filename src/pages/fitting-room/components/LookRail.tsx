import AnimatedNumber from "@/components/feature/AnimatedNumber";
import { CATEGORY_META, type StudioGarment } from "@/pages/fitting-room/utils/wardrobe";

interface LookRailProps {
  lookItems: StudioGarment[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onFit: () => void;
  onShop: () => void;
  busy: boolean;
  failed?: boolean;
}

export default function LookRail({
  lookItems,
  onRemove,
  onClear,
  onFit,
  onShop,
  busy,
  failed = false,
}: LookRailProps) {
  const total = lookItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-heading font-bold text-lg text-foreground-950">Your look</h3>
          <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-background-100 text-foreground-700 text-xs font-semibold">
            {lookItems.length}
          </span>
        </div>
        {lookItems.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-foreground-600 hover:text-accent-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            Clear all
          </button>
        )}
      </div>

      {lookItems.length === 0 ? (
        <div className="mt-3 flex flex-col items-center justify-center text-center py-5 rounded-md border border-dashed border-background-300">
          <span className="w-11 h-11 rounded-full bg-background-100 flex items-center justify-center">
            <i className="ri-t-shirt-line text-lg text-foreground-500"></i>
          </span>
          <p className="mt-2 text-sm text-foreground-600 max-w-[15rem]">
            Pick pieces from the wardrobe to build your look.
          </p>
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5 overflow-y-auto max-h-[200px] pr-1">
          {lookItems.map((item) => (
            <li key={item.id} className="flex items-center gap-3 animate-slide-in-right">
              <span className="w-11 h-14 rounded-md overflow-hidden bg-background-100 shrink-0 border border-background-200">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover object-top"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-label text-[10px] uppercase tracking-[0.14em] text-foreground-500">
                  {CATEGORY_META[item.category].label}
                </p>
                <p className="text-sm font-semibold text-foreground-950 truncate">{item.name}</p>
                <p className="text-xs text-foreground-600">${item.price}</p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                onClick={() => onRemove(item.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-foreground-500 hover:bg-background-100 hover:text-accent-600 transition-colors cursor-pointer shrink-0"
              >
                <i className="ri-close-line"></i>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 pt-4 border-t border-background-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-foreground-600">
            {lookItems.length} {lookItems.length === 1 ? "piece" : "pieces"}
          </span>
          <span className="font-heading font-bold text-xl text-foreground-950">
            <AnimatedNumber value={total} prefix="$" />
          </span>
        </div>
        <button
          type="button"
          onClick={onFit}
          disabled={busy || lookItems.length === 0}
          className="shine w-full inline-flex items-center justify-center gap-2 h-12 rounded-md bg-primary-500 text-foreground-950 font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i
            className={
              busy
                ? "ri-loader-4-line animate-spin"
                : failed
                  ? "ri-refresh-line text-lg"
                  : "ri-magic-line text-lg"
            }
          ></i>
          {busy ? "Fitting…" : failed ? "Try fitting again" : "Fit my look"}
        </button>
        <button
          type="button"
          onClick={onShop}
          disabled={lookItems.length === 0}
          className="mt-2 w-full inline-flex items-center justify-center gap-2 h-12 rounded-md border border-foreground-950 text-foreground-950 font-semibold hover:bg-foreground-950 hover:text-background-50 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="ri-shopping-bag-3-line"></i>
          Shop the look
        </button>
      </div>
    </div>
  );
}