import { useRef } from "react";
import {
  CATEGORY_META,
  money,
  type StudioGarment,
  type WardrobeCategory,
} from "@/pages/fitting-room/utils/wardrobe";

interface WardrobeSliderProps {
  category: WardrobeCategory;
  items: StudioGarment[];
  selectedIds: string[];
  onToggle: (category: WardrobeCategory, item: StudioGarment) => void;
}

export default function WardrobeSlider({
  category,
  items,
  selectedIds,
  onToggle,
}: WardrobeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const meta = CATEGORY_META[category];

  const scroll = (dir: number) => {
    trackRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <section className="w-full">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-full bg-foreground-950 text-background-50 flex items-center justify-center shrink-0">
            <i className={`${meta.icon} text-lg`}></i>
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-lg md:text-xl text-foreground-950 leading-tight">
                {meta.label}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-background-100 text-foreground-600 text-[10px] font-label uppercase tracking-[0.12em]">
                {meta.single ? "Pick one" : "Stack them"}
              </span>
            </div>
            <p className="text-xs text-foreground-600 truncate mt-0.5">
              {items.length} {items.length === 1 ? "piece" : "pieces"} · {meta.blurb}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            aria-label={`Scroll ${meta.label} left`}
            onClick={() => scroll(-1)}
            className="w-9 h-9 rounded-full border border-background-300 flex items-center justify-center text-foreground-800 hover:bg-background-100 hover:-translate-x-0.5 transition-all cursor-pointer"
          >
            <i className="ri-arrow-left-line"></i>
          </button>
          <button
            type="button"
            aria-label={`Scroll ${meta.label} right`}
            onClick={() => scroll(1)}
            className="w-9 h-9 rounded-full border border-background-300 flex items-center justify-center text-foreground-800 hover:bg-background-100 hover:translate-x-0.5 transition-all cursor-pointer"
          >
            <i className="ri-arrow-right-line"></i>
          </button>
        </div>
      </div>

      <div ref={trackRef} className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-2">
        {items.map((item, index) => {
          const selected = selectedIds.includes(item.id);
          return (
            <article
              key={item.id}
              style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
              className={`group shrink-0 w-40 sm:w-44 rounded-lg border bg-background-50 overflow-hidden transition-all duration-300 hover:-translate-y-1 animate-card-in ${
                selected
                  ? "border-primary-500 ring-1 ring-primary-500"
                  : "border-background-200 hover:border-foreground-300"
              }`}
            >
              <button
                type="button"
                onClick={() => onToggle(category, item)}
                aria-pressed={selected}
                className="block w-full text-left cursor-pointer"
              >
                <div className="relative aspect-[4/5] bg-background-100 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    title={`${item.name} — ${item.brand}`}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                  {item.badge && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-background-50/95 text-foreground-950 text-[10px] font-label uppercase tracking-[0.12em]">
                      {item.badge}
                    </span>
                  )}
                  <span
                    className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                      selected
                        ? "bg-primary-500 text-foreground-950 animate-pop"
                        : "bg-background-50/90 text-foreground-600 opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <i className={selected ? "ri-check-line" : "ri-add-line"}></i>
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="font-label text-[10px] uppercase tracking-[0.14em] text-foreground-500 truncate">
                    {item.brand}
                  </p>
                  <h4 className="mt-1 text-xs md:text-sm font-semibold text-foreground-950 leading-snug line-clamp-2 min-h-[2.5em]">
                    {item.name}
                  </h4>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {item.colors.slice(0, 3).map((color) => (
                        <span
                          key={color}
                          className="w-3.5 h-3.5 rounded-full border border-background-300"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-foreground-950">{money(item.price)}</span>
                  </div>
                </div>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}