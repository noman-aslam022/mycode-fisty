import type { Product, ProductAgeGroup } from "@/mocks/products";

// ── Fisty UI types ──────────────────────────────────────────────────────────
export type Gender = "men" | "women" | "kids";

export type AgeGroup = "adult" | "child" | "old";

export const GENDER_LABELS: Record<Gender, string> = {
  men: "Men",
  women: "Women",
  kids: "Kids",
};

export const AGE_LABELS: Record<AgeGroup, string> = {
  adult: "Adult",
  child: "Child",
  old: "Old",
};

// ── Legacy backend types (kept for existing backend components) ──────────────
export type OutfitSlot = "top" | "bottom" | "layer" | "accessory";

export type GenderArchetype = "men" | "women" | "all";
export type AgeStage = ProductAgeGroup;

export interface ShopperProfile {
  gender: GenderArchetype;
  ageGroup: AgeStage;
  styleVibe?: string;
}

export interface ImportedGarment {
  id: string;
  name: string;
  source: string;
  origin: string;
  slot?: OutfitSlot;
}

export type OutfitEntry =
  | {
      kind: "catalog";
      id: string;
      slot: OutfitSlot;
      product: Product;
      color: string;
    }
  | {
      kind: "imported";
      id: string;
      slot: OutfitSlot;
      garment: ImportedGarment;
    };

export interface BagItem {
  id: string;
  name: string;
  image: string;
  color?: string;
  price: number | null;
  qty: number;
}

export type TryOnStatus = "idle" | "generating" | "ready" | "error" | string;