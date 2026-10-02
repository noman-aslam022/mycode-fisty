import type { Product } from "@/mocks/products";
import { categoryIcon } from "@/pages/fitting-room/utils/outfit";

interface ProductListProps {
  products: Product[];
  loading: boolean;
  error: string;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onRetry: () => void;
}

export default function ProductList({
  products,
  loading,
  error,
  onEdit,
  onDelete,
  onRetry,
}: ProductListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-background-200 bg-background-100 overflow-hidden animate-pulse"
          >
            <div className="w-full aspect-[4/5] bg-background-200"></div>
            <div className="p-4 space-y-2">
              <div className="h-3 w-2/3 rounded bg-background-200"></div>
              <div className="h-3 w-1/3 rounded bg-background-200"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-background-200 bg-background-100 p-8 text-center">
        <i className="ri-error-warning-line text-3xl text-accent-500"></i>
        <p className="mt-3 font-heading font-bold text-foreground-950">
          We couldn&apos;t load your catalog
        </p>
        <p className="mt-1 text-sm text-foreground-500">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-full bg-foreground-950 text-background-50 text-sm font-medium hover:bg-foreground-800 transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-refresh-line"></i> Try again
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-background-300 bg-background-50 p-10 text-center">
        <span className="w-14 h-14 rounded-full bg-background-100 flex items-center justify-center mx-auto mb-4">
          <i className="ri-inbox-archive-line text-2xl text-foreground-600"></i>
        </span>
        <p className="font-heading font-bold text-foreground-950">No pieces yet</p>
        <p className="mt-1 text-sm text-foreground-500 max-w-xs mx-auto">
          Add your first piece with the form — it&apos;ll show up here and in the fitting room racks.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {products.map((product) => (
        <article
          key={product.id}
          className="group rounded-2xl overflow-hidden bg-background-50 border border-background-200 hover:border-foreground-300 transition-colors"
        >
          <div className="relative w-full aspect-[4/5] overflow-hidden bg-background-100">
            <img
              src={product.image}
              alt={product.name}
              title={`${product.name} — ${product.category}`}
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-foreground-950/80 text-background-50 text-[10px] font-label uppercase tracking-[0.12em]">
              <i className={categoryIcon(product.category)}></i> {product.category}
            </span>
            {product.onModel && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-500 text-background-50 text-[10px] font-label uppercase tracking-[0.12em]">
                <i className="ri-user-star-line"></i> On-model
              </span>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-heading font-bold text-base text-foreground-950 leading-snug line-clamp-2">
              {product.name}
            </h3>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <span className="font-heading font-extrabold text-lg text-foreground-950">
                ${product.price}
              </span>
              <div className="flex items-center gap-1.5">
                {product.colors.slice(0, 5).map((hex) => (
                  <span
                    key={hex}
                    className="w-4 h-4 rounded-full border border-background-300"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  ></span>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-full bg-foreground-950 text-background-50 text-sm font-medium hover:bg-foreground-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-edit-line"></i> Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(product.id)}
                aria-label={`Remove ${product.name}`}
                title="Remove from catalog"
                className="w-9 h-9 rounded-full border border-background-200 text-foreground-600 hover:text-accent-600 hover:border-accent-300 transition-colors cursor-pointer flex items-center justify-center"
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}