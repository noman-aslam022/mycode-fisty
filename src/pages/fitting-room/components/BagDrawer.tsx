import { useState } from "react";
import type { BagItem } from "../types";
import { bagCount, bagSubtotal } from "../utils/bag";
import { colorName } from "../utils/outfit";

interface BagDrawerProps {
  open: boolean;
  items: BagItem[];
  onClose: () => void;
  onChangeQty: (id: string, color: string | undefined, delta: number) => void;
  onRemove: (id: string, color: string | undefined) => void;
  onCheckout: () => void;
}

function LineThumb({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <span className="w-full h-full flex items-center justify-center text-foreground-400">
        <i className="ri-image-line text-xl"></i>
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

export default function BagDrawer({
  open,
  items,
  onClose,
  onChangeQty,
  onRemove,
  onCheckout,
}: BagDrawerProps) {
  const count = bagCount(items);
  const subtotal = bagSubtotal(items);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-foreground-950/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      ></div>

      <aside
        role="dialog"
        aria-label="Shopping bag"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-background-50 border-l border-background-200 flex flex-col transition-transform duration-500 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-5 md:px-6 h-20 border-b border-background-200 shrink-0">
          <div>
            <p className="font-heading font-extrabold text-lg text-foreground-950">Your bag</p>
            <p className="text-xs text-foreground-500">
              {count} {count === 1 ? "piece" : "pieces"} from your look
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag"
            className="w-10 h-10 rounded-full flex items-center justify-center text-foreground-600 hover:text-foreground-950 hover:bg-background-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 md:px-6 py-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <span className="w-14 h-14 rounded-full bg-background-100 flex items-center justify-center mb-4">
                <i className="ri-shopping-bag-3-line text-2xl text-foreground-400"></i>
              </span>
              <p className="font-heading font-bold text-foreground-950">Your bag is empty</p>
              <p className="text-sm text-foreground-500 mt-1 max-w-[16rem]">
                Build a look and hit &ldquo;Shop the look&rdquo; to drop every piece in here at
                once.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={`${item.id}-${item.color ?? "none"}`}
                  className="flex gap-3 rounded-2xl border border-background-200 bg-background-50 p-3"
                >
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-background-100 shrink-0">
                    <LineThumb src={item.image} alt={item.name} />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-heading font-bold text-sm text-foreground-950 leading-snug line-clamp-2">
                        {item.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => onRemove(item.id, item.color)}
                        aria-label={`Remove ${item.name}`}
                        className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-foreground-400 hover:text-foreground-900 hover:bg-background-100 transition-colors cursor-pointer"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                    {item.color && (
                      <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-foreground-500">
                        <span
                          className="w-3 h-3 rounded-full border border-background-300"
                          style={{ backgroundColor: item.color }}
                        ></span>
                        {colorName(item.color)}
                      </span>
                    )}
                    <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-full border border-background-200">
                        <button
                          type="button"
                          onClick={() => onChangeQty(item.id, item.color, -1)}
                          aria-label="Decrease quantity"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-foreground-600 hover:text-foreground-950 transition-colors cursor-pointer"
                        >
                          <i className="ri-subtract-line"></i>
                        </button>
                        <span className="w-7 text-center text-sm font-medium text-foreground-950">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onChangeQty(item.id, item.color, 1)}
                          aria-label="Increase quantity"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-foreground-600 hover:text-foreground-950 transition-colors cursor-pointer"
                        >
                          <i className="ri-add-line"></i>
                        </button>
                      </div>
                      <span className="font-heading font-extrabold text-sm text-foreground-950">
                        {item.price === null ? "—" : `$${item.price * item.qty}`}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-background-200 px-5 md:px-6 py-5 bg-background-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-foreground-600">Subtotal</span>
            <span className="font-heading font-extrabold text-2xl text-foreground-950">
              ${subtotal}
            </span>
          </div>
          <button
            type="button"
            disabled={items.length === 0}
            onClick={onCheckout}
            className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary-500 text-foreground-950 font-medium hover:bg-primary-400 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className="ri-secure-payment-line"></i> Checkout
          </button>
          <p className="mt-2 text-center text-xs text-foreground-400">
            Free shipping over $75 · 30-day easy returns
          </p>
        </div>
      </aside>
    </>
  );
}