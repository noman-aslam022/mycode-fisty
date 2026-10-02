import { useMemo, useState } from "react";
import { products, type Product } from "@/mocks/products";
import { colorName, SLOT_META } from "../utils/outfit";

interface CatalogGridProps {
  lookIds: string[];
  colorOf: (product: Product) => string;
  onSelectColor: (productId: string, hex: string) => void;
  onToggle: (product: Product) => void;
  busy: boolean;
  hasPhoto: boolean;
}

type AudienceKey = "all" | "men" | "women";

const AUDIENCES: { key: AudienceKey; label: string; icon: string }[] = [
  { key: "all", label: "Everyone", icon: "ri-group-line" },
  { key: "men", label: "Men", icon: "ri-men-line" },
  { key: "women", label: "Women", icon: "ri-women-line" },
];

function matchesAudience(product: Product, audience: AudienceKey): boolean {
  const group = product.audience ?? "unisex";
  if (audience === "all") return true;
  // A men's/women's rack also shows the shared unisex pieces.
  return group === audience || group === "unisex";
}

export default function CatalogGrid({
  lookIds,
  colorOf,
  onSelectColor,
  onToggle,
  busy,
  hasPhoto,
}: CatalogGridProps) {
  const [audience, setAudience] = useState<AudienceKey>("all");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    []
  );

  const visible = useMemo(
    () =>
      products.filter((p) => {
        if (!matchesAudience(p, audience)) return false;
        if (category === "All") return true;
        return p.category === category;
      }),
    [audience, category]
  );

  return (
    <section className="w-full px-4 md:px-6 lg:px-10 py-12 md:py-16 bg-background-50">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-2 font-label text-xs uppercase tracking-[0.22em] text-accent-700 mb-3">
            <i className="ri-store-3-line"></i> Step 04 — The racks
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-5xl tracking-tight text-foreground-950">
            Browse &amp; build
          </h2>
        </div>
        <p className="text-sm text-foreground-500 max-w-xs">
          Pick a colour, then add the piece. One top, one bottom and one layer — plus as many
          accessories as you like.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-8">
        <div className="inline-flex self-start items-center gap-1 p-1 rounded-full bg-background-100 border border-background-200">
          {AUDIENCES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setAudience(item.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                audience === item.key
                  ? "bg-foreground-950 text-background-50"
                  : "text-foreground-600 hover:text-foreground-950"
              }`}
            >
              <i className={item.icon}></i> {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                category === c
                  ? "bg-accent-500 text-background-50"
                  : "bg-background-50 text-foreground-700 border border-background-200 hover:border-foreground-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-foreground-500 py-10 text-center">
          Nothing in this rack yet — try another filter.
        </p>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          data-product-shop
        >
          {visible.map((product) => {
            const inLook = lookIds.includes(product.id);
            const activeColor = colorOf(product);
            return (
              <article
                key={product.id}
                className={`group rounded-2xl overflow-hidden bg-background-50 border transition-all duration-300 ${
                  inLook
                    ? "border-primary-500"
                    : "border-background-200 hover:-translate-y-1.5 hover:border-foreground-300"
                }`}
              >
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-background-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    title={`${product.name} — ${product.category}`}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  {product.badge && (
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-foreground-950/80 text-background-50 text-[11px] font-label uppercase tracking-[0.14em]">
                      {product.badge}
                    </span>
                  )}
                  {inLook && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-500 text-foreground-950 text-[11px] font-label uppercase tracking-[0.12em]">
                      <i className="ri-check-line"></i> In look
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-label text-[10px] uppercase tracking-[0.16em] text-foreground-500">
                      {product.category}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-900 text-[10px] font-label uppercase tracking-[0.12em]">
                      <i className={SLOT_META[product.slot].icon}></i>{" "}
                      {SLOT_META[product.slot].short}
                    </span>
                  </div>
                  <h3 className="mt-1 font-heading font-bold text-base text-foreground-950 leading-snug line-clamp-2">
                    {product.name}
                  </h3>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="font-label text-[10px] uppercase tracking-[0.16em] text-foreground-400">
                      Colour
                    </span>
                    <div className="flex items-center gap-1.5">
                      {product.colors.map((hex) => {
                        const active = activeColor === hex;
                        return (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => onSelectColor(product.id, hex)}
                            aria-label={`Choose ${colorName(hex)}`}
                            title={colorName(hex)}
                            aria-pressed={active}
                            className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                              active
                                ? "border-foreground-950 ring-2 ring-offset-2 ring-foreground-950/20"
                                : "border-background-300 hover:border-foreground-400"
                            }`}
                            style={{ backgroundColor: hex }}
                          ></button>
                        );
                      })}
                    </div>
                    <span className="text-[11px] text-foreground-500">{colorName(activeColor)}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="font-heading font-extrabold text-lg text-foreground-950">
                      ${product.price}
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onToggle(product)}
                      className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
                        inLook
                          ? "bg-primary-500 text-foreground-950"
                          : "bg-foreground-950 text-background-50 hover:bg-foreground-800"
                      }`}
                    >
                      <i className={inLook ? "ri-check-line" : "ri-add-line"}></i>
                      {inLook ? "In your look" : "Add to look"}
                    </button>
                  </div>
                  {!hasPhoto && (
                    <p className="mt-2 text-xs text-foreground-400">Add your photo to fit the look</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}