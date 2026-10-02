import type { Product } from "@/mocks/products";
import type { OutfitEntry, OutfitSlot } from "../types";
import { accessoryKind } from "./masking";

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
    short: "Jacket",
    hint: "Zip jackets & coats worn over a top",
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
// A hoodie is a "top", so it also blocks a shirt from being stacked on it.
// Accessories can stack without limit.
export function isSingleSlot(slot: OutfitSlot): boolean {
  return slot !== "accessory";
}

/**
 * The catalog categories the owner picks from, and the fitting-room slot each
 * one fills. Top and Hoodie both fill the torso ("top"), which is exactly what
 * makes a hoodie reject an inner shirt: picking a shirt swaps the hoodie out
 * (and vice-versa). A Jacket fills the outer "layer", which CAN sit over a top
 * — so a zip jacket accepts an inner shirt, or keeps the one already in your
 * photo when none is chosen.
 */
export interface CategoryDef {
  label: string;
  slot: OutfitSlot;
  hint: string;
  icon: string;
}

export const CATEGORY_DEFS: CategoryDef[] = [
  { label: "Top", slot: "top", hint: "Tees, shirts & polos", icon: "ri-t-shirt-line" },
  { label: "Hoodie", slot: "top", hint: "Hoodies & sweatshirts", icon: "ri-t-shirt-2-line" },
  {
    label: "Jacket",
    slot: "layer",
    hint: "Zip jackets & coats over a top",
    icon: "ri-stack-line",
  },
  { label: "Bottom", slot: "bottom", hint: "Pants, jeans & skirts", icon: "ri-walk-line" },
  { label: "Accessory", slot: "accessory", hint: "Hats, glasses & bags", icon: "ri-vip-diamond-line" },
];

/** Resolves the catalog category label to its icon, for badges across the app. */
export function categoryIcon(label: string): string {
  return (
    CATEGORY_DEFS.find((c) => c.label.toLowerCase() === label.toLowerCase())?.icon ??
    "ri-price-tag-3-line"
  );
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
  "#c2ad8e": "Sand",
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
  layer: "wear the provided outerwear piece over the torso",
  accessory: "place the provided accessory naturally in its correct location on the person",
};

// Accessories all share one slot, so each kind needs its own placement words or
// the engine is free to hang a pair of sneakers off the shoulder.
const ACCESSORY_DIRECTION: Record<string, string> = {
  footwear: "put this shoe on the person's foot, aligned to the ankle and the ground",
  glasses: "put these glasses on the person's face, aligned to the eyes",
  hat: "put this hat on the person's head, sitting on the hair",
  necklace: "put this necklace around the person's neck",
  bag: "put this bag on the person's shoulder or hip as it naturally hangs",
  wrist: "put this item on the person's wrist",
  generic: "place this accessory on the person where it is normally worn",
};

const pieceDirection = (entry: OutfitEntry): string => {
  const dir = SLOT_DIRECTION[entry.slot];
  if (entry.slot !== "accessory") return dir;
  return ACCESSORY_DIRECTION[accessoryKind(entry)] ?? ACCESSORY_DIRECTION.generic;
};

// Precise styling instruction for the try-on engine:
// swap garments/accessories while locking the person's exact face, skin tone,
// hair, body shape, posture and appearance unchanged.
export function batchInstruction(entries: OutfitEntry[]): string {
  const sorted = sortLook(entries);
  const hasTop = sorted.some((entry) => entry.slot === "top");
  const hasLayer = sorted.some((entry) => entry.slot === "layer");

  // Each piece is pinned to its position in the reference image list, otherwise
  // two accessories in one batch receive the same direction and get swapped.
  const parts = sorted.map((entry, index) => {
    const dir = pieceDirection(entry);
    const colour = entry.kind === "catalog" ? ` in ${colorName(entry.color)} colour` : "";
    return `reference image ${index + 1} ("${entryName(entry)}"): ${dir}${colour}`;
  });

  // A zip jacket worn with no chosen inner top keeps whatever top the person is
  // already wearing in the original photo, shown open underneath.
  const layerNote =
    hasLayer && !hasTop
      ? " The outerwear is worn open over the person's EXISTING inner top: keep that original shirt, hoodie or top exactly as it is in the source photo — do not replace, remove, or recolour it."
      : "";

  return (
    `Strict clothing-only virtual try-on: ${parts.join("; ")}.${layerNote} ` +
    `CRITICAL IDENTITY AND PHYSICAL APPEARANCE LOCK: Keep the person's exact face, facial features, eyes, eyebrows, nose, mouth, lips, jawline, skin tone, skin complexion, hair, hairstyle, body shape, body proportions, posture, pose, hands, phone/objects, and background 100% identical and unchanged from the source photo. ` +
    `Do NOT redraw, regenerate, alter, or replace the person's face, head, skin, or physical appearance. Only swap and drape the specified clothing onto the body.`
  );
}