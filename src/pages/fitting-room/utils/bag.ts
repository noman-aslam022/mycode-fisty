import type { BagItem, OutfitEntry } from "../types";

// Turn the current look into shoppable bag lines. Imported pieces have no price.
export function bagItemsFromLook(entries: OutfitEntry[]): BagItem[] {
  return entries.map((entry) =>
    entry.kind === "catalog"
      ? {
          id: entry.id,
          name: entry.product.name,
          image: entry.product.image,
          color: entry.color,
          price: entry.product.price,
          qty: 1,
        }
      : {
          id: entry.id,
          name: entry.garment.name,
          image: entry.garment.source,
          price: null,
          qty: 1,
        }
  );
}

const sameLine = (a: BagItem, b: BagItem) => a.id === b.id && a.color === b.color;

// Add new lines, bumping quantity when the exact same piece + colour is present.
export function mergeBag(existing: BagItem[], incoming: BagItem[]): BagItem[] {
  const next = existing.map((item) => ({ ...item }));
  incoming.forEach((item) => {
    const idx = next.findIndex((line) => sameLine(line, item));
    if (idx >= 0) next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
    else next.push({ ...item });
  });
  return next;
}

export function bagCount(items: BagItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export function bagSubtotal(items: BagItem[]): number {
  return items.reduce((sum, item) => sum + (item.price ?? 0) * item.qty, 0);
}
