import type { Product, ProductAgeGroup, ProductSlot } from "@/mocks/products";
import { sampleModels } from "@/mocks/wardrobe";
import type { AgeGroup, Gender } from "@/pages/fitting-room/types";

export type WardrobeAudience = "men" | "women" | "kids" | "unisex";

export type WardrobeCategory = "torso" | "pants" | "jackets" | "footwear" | "accessories";

export interface CategoryMeta {
  label: string;
  icon: string;
  single: boolean;
  blurb: string;
}

export const CATEGORY_ORDER: WardrobeCategory[] = [
  "torso",
  "pants",
  "jackets",
  "footwear",
  "accessories",
];

export const CATEGORY_META: Record<WardrobeCategory, CategoryMeta> = {
  torso: {
    label: "Torso",
    icon: "ri-t-shirt-line",
    single: true,
    blurb: "Tops, tees, knits and shirting",
  },
  pants: {
    label: "Pants",
    icon: "ri-layout-bottom-line",
    single: true,
    blurb: "Denim, trousers, cargo and skirts",
  },
  jackets: {
    label: "Jackets",
    icon: "ri-shirt-line",
    single: true,
    blurb: "Outerwear, coats and layers",
  },
  footwear: {
    label: "Footwear",
    icon: "ri-footprint-line",
    single: true,
    blurb: "Sneakers, boots and more",
  },
  accessories: {
    label: "Accessories",
    icon: "ri-vip-diamond-line",
    single: false,
    blurb: "Stack as many finishing touches as you like",
  },
};

/** A catalog product, shaped for the studio racks. */
export interface StudioGarment {
  id: string;
  name: string;
  brand: string;
  price: number;
  compareAt?: number;
  category: WardrobeCategory;
  audience: WardrobeAudience;
  colors: string[];
  rating: number;
  reviews: number;
  badge?: string;
  image: string;
  /** The catalog record this came from — carries the garment cut-out. */
  product: Product;
}

/** Each fitting slot hangs on its own rail in the studio. */
const SLOT_RAIL: Record<ProductSlot, WardrobeCategory> = {
  top: "torso",
  layer: "jackets",
  bottom: "pants",
  accessory: "accessories",
};

const FOOTWEAR_HINTS = [
  "shoe",
  "sneaker",
  "boot",
  "sandal",
  "loafer",
  "heel",
  "trainer",
  "footwear",
  "slipper",
  "clog",
  "mule",
  "sandal",
];

/** Shoes have no slot of their own, so the rail is read off the category and tags. */
export const isFootwear = (product: Product): boolean => {
  const haystack = [product.category ?? "", ...(product.tags ?? [])].join(" ").toLowerCase();
  return FOOTWEAR_HINTS.some((hint) => haystack.includes(hint));
};

export const railFor = (product: Product): WardrobeCategory =>
  isFootwear(product) ? "footwear" : SLOT_RAIL[product.slot];

/** Every generation a piece is aimed at; an empty list means "all of them". */
export const ageStagesOf = (product: Product): ProductAgeGroup[] => {
  if (product.ageGroups?.length) return product.ageGroups;
  return product.ageGroup ? [product.ageGroup] : [];
};

const AGE_STAGE_TO_GROUP: Record<ProductAgeGroup, AgeGroup | null> = {
  kids: "child",
  adults: "adult",
  seniors: "old",
  all: null,
};

const isKidsProfile = (gender: Gender | null, age: AgeGroup | null): boolean =>
  gender === "kids" || age === "child";

/** Does this catalog piece belong in the shopper's racks? */
export const matchesProfile = (
  product: Product,
  gender: Gender | null,
  age: AgeGroup | null
): boolean => {
  const audience = product.audience ?? "unisex";
  const stages = ageStagesOf(product);

  if (isKidsProfile(gender, age)) {
    // Kids get kids pieces plus anything not locked to a grown-up audience.
    if (audience !== "unisex") return false;
    return stages.every((stage) => stage === "all" || stage === "kids");
  }

  if (gender && audience !== "unisex" && audience !== gender) return false;
  if (age) {
    const groups = stages
      .map((stage) => AGE_STAGE_TO_GROUP[stage])
      .filter((group): group is AgeGroup => group !== null);
    if (groups.length > 0 && !groups.includes(age)) return false;
  }
  return true;
};

export const toGarment = (product: Product): StudioGarment => ({
  id: product.id,
  name: product.name,
  brand: product.category || "Catalog",
  price: product.price,
  compareAt: product.compareAt,
  category: railFor(product),
  audience: product.audience ?? "unisex",
  colors: product.colors ?? [],
  rating: product.rating ?? 0,
  reviews: product.reviews ?? 0,
  badge: product.badge,
  image: product.image,
  product,
});

/** The whole catalog, mapped onto the studio rails. */
export const garmentsFromCatalog = (catalog: Product[]): StudioGarment[] =>
  catalog.filter((product) => Boolean(product?.image)).map(toGarment);

/** Only the pieces this shopper profile should see. */
export const garmentsForProfile = (
  catalog: Product[],
  gender: Gender | null,
  age: AgeGroup | null
): StudioGarment[] =>
  garmentsFromCatalog(catalog.filter((product) => matchesProfile(product, gender, age)));

/** Which audience bucket the picks are pulled from. */
export const resolveAudience = (gender: Gender | null, age: AgeGroup | null): WardrobeAudience => {
  if (age === "child" || gender === "kids") return "kids";
  return (gender as WardrobeAudience) ?? "unisex";
};

/** Pick a sample body that matches the chosen gender + age group. */
export const sampleModelFor = (gender: Gender | null, age: AgeGroup | null): string => {
  const audience = resolveAudience(gender, age);
  if (audience === "kids") return sampleModels.kids;
  return audience === "men" ? sampleModels.men : sampleModels.women;
};

export const byCategory = <T extends { category: WardrobeCategory }>(
  items: T[],
  category: WardrobeCategory
): T[] => items.filter((item) => item.category === category);

export const money = (value: number): string => `$${value.toFixed(0)}`;
