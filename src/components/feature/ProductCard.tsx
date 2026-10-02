import { useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "@/mocks/products";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);

  return (
    <article className="group h-full flex flex-col rounded-2xl overflow-hidden bg-background-50 border border-background-200 transition-all duration-300 hover:-translate-y-1.5 hover:border-foreground-300">
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-background-100">
        <img
          src={product.image}
          alt={product.name}
          title={`${product.name} — ${product.category}`}
          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
        />

        {product.badge && (
          <span
            className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-label uppercase tracking-[0.14em] ${
              product.badge === "New" || product.badge === "Viral" || product.badge === "Limited"
                ? "bg-accent-500 text-background-50"
                : "bg-primary-500 text-foreground-950"
            }`}
          >
            {product.badge}
          </span>
        )}

        <button
          type="button"
          aria-label="Add to wishlist"
          onClick={() => setWished((v) => !v)}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background-50/90 backdrop-blur flex items-center justify-center text-foreground-800 hover:bg-background-50 transition-colors cursor-pointer"
        >
          <i className={wished ? "ri-heart-3-fill text-accent-500 text-lg" : "ri-heart-3-line text-lg"}></i>
        </button>

        <div className="absolute inset-x-3 bottom-3 translate-y-16 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            type="button"
            onClick={() => setAdded((v) => !v)}
            className={`w-full h-11 rounded-full font-heading font-bold text-sm transition-colors cursor-pointer whitespace-nowrap ${
              added
                ? "bg-secondary-700 text-background-50"
                : "bg-foreground-950 text-background-50 hover:bg-foreground-800"
            }`}
          >
            {added ? "Added to bag ✓" : "Quick add"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-label text-[10px] uppercase tracking-[0.16em] text-foreground-500">
            {product.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-foreground-600">
            <i className="ri-star-fill text-accent-500"></i>
            {product.rating} ({product.reviews})
          </span>
        </div>

        <h3 className="font-heading font-bold text-base text-foreground-950 leading-snug line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-center justify-between gap-3 mt-1">
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-xl text-foreground-950">
              ${product.price}
            </span>
            {product.compareAt && (
              <span className="text-sm text-foreground-400 line-through">${product.compareAt}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {product.colors.map((color) => (
              <span
                key={color}
                className="w-3.5 h-3.5 rounded-full border border-background-300"
                style={{ backgroundColor: color }}
              ></span>
            ))}
          </div>
        </div>

        <Link
          to={`/fitting-room?product=${product.id}`}
          className="mt-2 inline-flex items-center justify-center gap-1.5 h-9 rounded-full border border-background-300 text-foreground-800 text-sm font-medium hover:border-foreground-950 hover:text-foreground-950 transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-magic-line"></i> Try on
        </Link>
      </div>
    </article>
  );
}