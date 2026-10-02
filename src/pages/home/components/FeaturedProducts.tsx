import { useMemo, useState } from "react";
import Reveal from "@/components/base/Reveal";
import ProductCard from "@/components/feature/ProductCard";
import { products } from "@/mocks/products";

const tabs = ["All", "Streetwear", "Outerwear", "Accessories", "Tops", "Bottoms", "Footwear"];

export default function FeaturedProducts() {
  const [active, setActive] = useState("All");

  const filtered = useMemo(() => {
    if (active === "All") return products;
    return products.filter((p) => p.category === active);
  }, [active]);

  return (
    <section id="featured" className="relative w-full py-16 md:py-24 bg-background-50">
      <div className="w-full px-4 md:px-6 lg:px-10">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-8 md:mb-10">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 font-label text-xs uppercase tracking-[0.22em] text-secondary-700 mb-4">
                <i className="ri-fire-line"></i> 03 — The Drop
              </span>
              <h2 className="font-heading font-extrabold text-4xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-foreground-950">
                Worn by the
                <br />
                internet right now.
              </h2>
            </div>
            <a
              href="#categories"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-foreground-300 text-foreground-950 font-heading font-bold hover:bg-foreground-950 hover:text-background-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Browse everything
              <i className="ri-arrow-right-line text-lg"></i>
            </a>
          </div>
        </Reveal>

        {/* Tabs */}
        <Reveal delay={60}>
          <div className="flex flex-wrap gap-2 mb-8 md:mb-10">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActive(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  active === tab
                    ? "bg-foreground-950 text-background-50 border-foreground-950"
                    : "bg-background-100 text-foreground-700 border-background-200 hover:border-foreground-400"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" data-product-shop>
          {filtered.map((product, i) => (
            <Reveal key={product.id} className="h-full" delay={(i % 4) * 70}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-foreground-500 py-16">No pieces in this category yet.</p>
        )}
      </div>
    </section>
  );
}