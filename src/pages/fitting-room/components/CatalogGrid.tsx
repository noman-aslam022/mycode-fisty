import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "@/mocks/products";
import type { ShopperProfile, GenderArchetype, AgeStage } from "../types";
import { categoryIcon, colorName } from "../utils/outfit";

interface CatalogGridProps {
  products: Product[];
  lookIds: string[];
  colorOf: (product: Product) => string;
  onSelectColor: (productId: string, hex: string) => void;
  onToggle: (product: Product) => void;
  busy: boolean;
  hasPhoto: boolean;
  shopperProfile?: ShopperProfile | null;
  onEditProfile?: () => void;
}

type AudienceKey = "all" | "men" | "women";

const AUDIENCES: { key: AudienceKey; label: string; icon: string }[] = [
  { key: "all", label: "All Genders", icon: "ri-group-line" },
  { key: "women", label: "Women", icon: "ri-women-line" },
  { key: "men", label: "Men", icon: "ri-men-line" },
];

const AGE_STAGES: { key: AgeStage; label: string; icon: string }[] = [
  { key: "all", label: "All Ages", icon: "ri-apps-line" },
  { key: "kids", label: "Kids & Youth (4–15)", icon: "ri-bear-smile-line" },
  { key: "adults", label: "Adults (16–50)", icon: "ri-user-smile-line" },
  { key: "seniors", label: "Classic & Mature (50+)", icon: "ri-vip-crown-line" },
];

function matchesAudience(product: Product, audience: AudienceKey): boolean {
  const group = product.audience ?? "unisex";
  if (audience === "all") return true;
  return group === audience || group === "unisex";
}

function matchesAgeStage(product: Product, age: AgeStage): boolean {
  if (age === "all") return true;
  const productAge = product.ageGroup ?? "adults";
  return productAge === age || productAge === "all";
}

export default function CatalogGrid({
  products,
  lookIds,
  colorOf,
  onSelectColor,
  onToggle,
  busy,
  hasPhoto,
  shopperProfile,
  onEditProfile,
}: CatalogGridProps) {
  const [audience, setAudience] = useState<AudienceKey>(
    (shopperProfile?.gender as AudienceKey) ?? "all"
  );
  const [ageStage, setAgeStage] = useState<AgeStage>(
    shopperProfile?.ageGroup ?? "all"
  );
  const [category, setCategory] = useState("All");

  // Keep synced if profile changes externally
  useEffect(() => {
    if (shopperProfile) {
      setAudience((shopperProfile.gender as AudienceKey) ?? "all");
      setAgeStage(shopperProfile.ageGroup ?? "all");
    }
  }, [shopperProfile]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const visible = useMemo(
    () =>
      products.filter((p) => {
        if (!matchesAudience(p, audience)) return false;
        if (!matchesAgeStage(p, ageStage)) return false;
        if (category === "All") return true;
        return p.category.toLowerCase() === category.toLowerCase();
      }),
    [products, audience, ageStage, category]
  );

  const resetFilters = () => {
    setAudience("all");
    setAgeStage("all");
    setCategory("All");
  };

  return (
    <section className="w-full px-4 md:px-6 lg:px-10 py-12 md:py-16 bg-background-50">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-2 font-label text-xs uppercase tracking-[0.22em] text-accent-700 mb-3">
            <i className="ri-store-3-line"></i> Step 04 — The Wardrobe Racks
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-5xl tracking-tight text-foreground-950">
            Browse &amp; build
          </h2>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 max-w-xs">
          <p className="text-sm text-foreground-500">
            Pick a colour, then add the piece. One top, one bottom, one layer &mdash; plus unlimited
            accessories.
          </p>
          <div className="flex items-center gap-3">
            {onEditProfile && (
              <button
                type="button"
                onClick={onEditProfile}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-700 hover:text-accent-900 transition-colors"
              >
                <i className="ri-user-settings-line"></i> Switch Shopper Profile
              </button>
            )}
            <Link
              to="/catalog"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-700 hover:text-foreground-950 transition-colors whitespace-nowrap"
            >
              <i className="ri-folders-line"></i> Manage catalog
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Bar with Dual Level Filtering (Gender + Age Group + Categories) */}
      <div className="flex flex-col gap-4 mb-8 p-4 rounded-2xl bg-background-100/70 border border-background-200">
        {/* Active Shopper Persona Badge & Quick Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-background-200/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-500 animate-pulse"></span>
            <span className="text-xs font-medium text-foreground-700">
              Active Filter:{" "}
              <strong>
                {audience === "all" ? "All Genders" : audience === "women" ? "Women" : "Men"} &bull;{" "}
                {ageStage === "all"
                  ? "All Generations"
                  : ageStage === "kids"
                  ? "Kids & Youth"
                  : ageStage === "seniors"
                  ? "Classic & Mature Elegance"
                  : "Adults"}
              </strong>
            </span>
          </div>

          {(audience !== "all" || ageStage !== "all" || category !== "All") && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-medium text-accent-700 hover:text-accent-950 underline underline-offset-2 cursor-pointer"
            >
              Show all items (Clear filters)
            </button>
          )}
        </div>

        {/* Gender Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-foreground-500 w-20 shrink-0">
            Gender:
          </span>
          <div className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-background-50 border border-background-200">
            {AUDIENCES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setAudience(item.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  audience === item.key
                    ? "bg-foreground-950 text-background-50 shadow-sm"
                    : "text-foreground-600 hover:text-foreground-950 hover:bg-background-100"
                }`}
              >
                <i className={item.icon}></i> {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generation / Age Group Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-foreground-500 w-20 shrink-0">
            Generation:
          </span>
          <div className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-background-50 border border-background-200">
            {AGE_STAGES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setAgeStage(item.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  ageStage === item.key
                    ? "bg-accent-600 text-background-50 shadow-sm"
                    : "text-foreground-600 hover:text-foreground-950 hover:bg-background-100"
                }`}
              >
                <i className={item.icon}></i> {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-background-200/80">
          <span className="text-xs font-semibold text-foreground-500 w-20 shrink-0">
            Category:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  category === c
                    ? "bg-primary-500 text-foreground-950 font-bold shadow-sm"
                    : "bg-background-50 text-foreground-700 border border-background-200 hover:border-foreground-300"
                }`}
              >
                {c !== "All" && <i className={`${categoryIcon(c)} mr-1`}></i>}
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of pieces */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {visible.map((product) => {
            const inLook = lookIds.includes(product.id);
            const activeColor = colorOf(product);
            const badgeIcon = categoryIcon(product.category);

            return (
              <div
                key={product.id}
                className={`group flex flex-col rounded-3xl border bg-background-50 overflow-hidden transition-all duration-300 ${
                  inLook
                    ? "border-primary-500 ring-2 ring-primary-500/20 shadow-lg"
                    : "border-background-200 hover:border-foreground-300 hover:shadow-md"
                }`}
              >
                {/* Photo & badges */}
                <div className="relative aspect-[3/4] bg-background-100 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Category pill */}
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background-50/90 backdrop-blur-md text-[10px] font-label uppercase tracking-[0.14em] text-foreground-800 shadow-sm">
                    <i className={badgeIcon}></i> {product.category}
                  </span>

                  {/* Age or audience pill */}
                  {product.ageGroup && product.ageGroup !== "adults" && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-600/90 text-background-50 text-[10px] font-label uppercase tracking-wider shadow-sm">
                      {product.ageGroup === "kids" ? "Kids" : "Classic"}
                    </span>
                  )}

                  {product.badge && (!product.ageGroup || product.ageGroup === "adults") && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-foreground-950 text-background-50 text-[10px] font-label uppercase tracking-wider">
                      {product.badge}
                    </span>
                  )}

                  {/* Selected indicator */}
                  {inLook && (
                    <div className="absolute inset-0 bg-primary-500/10 pointer-events-none flex items-center justify-center">
                      <span className="w-12 h-12 rounded-full bg-primary-500 text-foreground-950 flex items-center justify-center shadow-lg font-heading font-extrabold text-sm">
                        <i className="ri-check-line text-2xl"></i>
                      </span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h3 className="font-heading font-bold text-sm md:text-base text-foreground-950 line-clamp-1 group-hover:text-accent-600 transition-colors">
                      {product.name}
                    </h3>

                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-heading font-extrabold text-base text-foreground-950">
                        ${product.price}
                      </span>
                      {product.compareAt && (
                        <span className="text-xs text-foreground-400 line-through">
                          ${product.compareAt}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Color swatches */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {product.colors.map((c) => {
                        const selected = c.toLowerCase() === activeColor.toLowerCase();
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => onSelectColor(product.id, c)}
                            aria-label={`Select ${colorName(c)} colour`}
                            className={`w-5 h-5 rounded-full transition-transform cursor-pointer border ${
                              selected
                                ? "scale-125 ring-2 ring-foreground-950 ring-offset-1 border-transparent"
                                : "border-background-300 hover:scale-110"
                            }`}
                            style={{ backgroundColor: c }}
                            title={colorName(c)}
                          />
                        );
                      })}
                      <span className="text-[11px] text-foreground-400 ml-1">
                        {colorName(activeColor)}
                      </span>
                    </div>
                  )}

                  {/* Add / Remove button */}
                  <button
                    type="button"
                    onClick={() => onToggle(product)}
                    disabled={busy}
                    className={`w-full h-11 rounded-2xl font-medium text-xs md:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      inLook
                        ? "bg-background-200 text-foreground-900 hover:bg-background-300"
                        : "bg-foreground-950 text-background-50 hover:bg-foreground-800 shadow-sm"
                    }`}
                  >
                    <i className={inLook ? "ri-delete-bin-line" : "ri-add-line"}></i>
                    <span>{inLook ? "Remove from look" : "Add to look"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-background-300 bg-background-100/50 p-12 text-center max-w-lg mx-auto">
          <span className="w-14 h-14 rounded-full bg-background-200 flex items-center justify-center mx-auto mb-4 text-2xl text-foreground-400">
            <i className="ri-t-shirt-line"></i>
          </span>
          <h3 className="font-heading font-bold text-lg text-foreground-950">
            No pieces match this combination
          </h3>
          <p className="text-sm text-foreground-500 mt-2 mb-6">
            Try adjusting your gender, generation, or category filters to view more styles.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground-950 text-background-50 text-sm font-medium hover:bg-foreground-800 transition-colors cursor-pointer"
          >
            <i className="ri-refresh-line"></i> Reset all filters
          </button>
        </div>
      )}
    </section>
  );
}