import type { Product } from "@/mocks/products";
import type { OutfitEntry, OutfitSlot } from "../types";

export const SLOT_ORDER: OutfitSlot[] = ["top", "bottom", "layer", "accessory"];

export const SLOT_META: Record<
  OutfitSlot,
  { label: string; short: string; hint: string; icon: string }
> = {
  top: {
    label: "Top",
    short: "Top",
    hint: "Tees, hoodies & shirts",
    icon: "ri-t-shirt-line",
  },
  bottom: {
    label: "Bottom",
    short: "Bottom",
    hint: "Pants, trousers & jeans",
    icon: "ri-walk-line",
  },
  layer: {
    label: "Layer",
    short: "Layer",
    hint: "Jackets & coats worn over the top",
    icon: "ri-stack-line",
  },
  accessory: {
    label: "Accessory",
    short: "Accessory",
    hint: "Glasses, hats, jewellery & bags",
    icon: "ri-vip-diamond-line",
  },
};

// Top / Bottom / Layer each hold a single piece — adding another swaps it out.
// Accessories can stack without limit.
export function isSingleSlot(slot: OutfitSlot): boolean {
  return slot !== "accessory";
}

// Bria composites at most three pieces per render. Bigger looks are chained:
// the first batch is fitted on your photo, then each extra batch is layered
// onto the previous result — so a look can hold any number of pieces.
export const MAX_BATCH = 3;

const COLOR_NAMES: Record<string, string> = {
  "#c9d39b": "Lime",
  "#3a3a34": "Charcoal",
  "#b4571f": "Rust",
  "#4a4a42": "Graphite",
  "#8a4a1f": "Amber",
  "#efe8d8": "Cream",
  "#8a7f5c": "Olive",
  "#c9cdd3": "Silver",
  "#7f8a5c": "Moss",
  "#4a5a72": "Denim",
  "#c9a227": "Gold",
};

export function colorName(hex: string): string {
  return COLOR_NAMES[hex.toLowerCase()] ?? "Custom";
}

export function slotOfProduct(product: Product): OutfitSlot {
  return product.slot;
}

export function entrySource(entry: OutfitEntry): string {
  return entry.kind === "catalog" ? entry.product.image : entry.garment.source;
}

export function entryName(entry: OutfitEntry): string {
  return entry.kind === "catalog" ? entry.product.name : entry.garment.name;
}

export function entrySubtitle(entry: OutfitEntry): string {
  return entry.kind === "catalog"
    ? `${entry.product.category} · $${entry.product.price}`
    : `From ${entry.garment.origin}`;
}

// Order pieces by group so clothing is laid down before accessories.
export function sortLook(entries: OutfitEntry[]): OutfitEntry[] {
  return [...entries].sort(
    (a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot)
  );
}

// Split a look into render batches of at most MAX_BATCH pieces each.
export function batchLook(entries: OutfitEntry[], size = MAX_BATCH): OutfitEntry[][] {
  const sorted = sortLook(entries);
  const batches: OutfitEntry[][] = [];
  for (let i = 0; i < sorted.length; i += size) {
    batches.push(sorted.slice(i, i + size));
  }
  return batches;
}

// How each piece should be described when directing the try-on engine.
const SLOT_DIRECTION: Record<OutfitSlot, string> = {
  top: "swap the upper garment with the provided top piece on the torso",
  bottom: "swap the lower garment with the provided bottom piece on the legs",
  layer: "layer the provided outerwear piece over the top garment",
  accessory: "place the provided accessory naturally in its correct location on the person",
};

// Precise styling instruction for Bria AI Virtual Try-On:
// Tells the engine to strictly swap garments/accessories while locking the person's
// exact face, skin tone, hair, body shape, posture, and appearance unchanged.
export function batchInstruction(entries: OutfitEntry[]): string {
  const parts = sortLook(entries).map((entry) => {
    const dir = SLOT_DIRECTION[entry.slot];
    if (entry.kind === "catalog") {
      return `${dir} in ${colorName(entry.color)} colour`;
    }
    return dir;
  });

  return (
    `Strict clothing-only virtual try-on: ${parts.join("; ")}. ` +
    `CRITICAL IDENTITY AND PHYSICAL APPEARANCE LOCK: Keep the person's exact face, facial features, eyes, eyebrows, nose, mouth, lips, jawline, skin tone, skin complexion, hair, hairstyle, body shape, body proportions, posture, pose, hands, phone/objects, and background 100% identical and unchanged from the source photo. ` +
    `Do NOT redraw, regenerate, alter, or replace the person's face, head, skin, or physical appearance. Only swap and drape the specified clothing onto the body.`
  );
}