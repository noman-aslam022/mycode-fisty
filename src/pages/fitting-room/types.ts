import type { Product } from "@/mocks/products";

export type OutfitSlot = "top" | "bottom" | "layer" | "accessory";

export type GenderArchetype = "men" | "women" | "all";
export type AgeStage = "kids" | "adults" | "seniors" | "all";

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
