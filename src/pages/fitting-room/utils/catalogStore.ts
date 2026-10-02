import { useCallback, useEffect, useMemo, useState } from "react";
import { products as builtinProducts, type Product } from "@/mocks/products";

/**
 * Local catalog store.
 *
 * Products a shop owner uploads (name, price, category, photo) are structured
 * data with embedded images, so they live in IndexedDB — the only browser
 * storage suitable for long-term structured data of this size.
 */

const DB_NAME = "vestra-catalog-db";
const STORE_NAME = "catalog-products";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("This browser can't store your catalog locally."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open the catalog store."));
  });
}

function getDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = openDb().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export async function listUserProducts(): Promise<Product[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as Product[]) ?? []);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not read your catalog."));
  });
}

export async function saveUserProduct(product: Product): Promise<void> {
  const db = await getDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(product);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Could not save that product."));
  });
}

export async function deleteUserProduct(id: string): Promise<void> {
  const db = await getDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Could not remove that product."));
  });
}

export function makeProductId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `u-${crypto.randomUUID()}`;
  }
  return `u-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

export interface CatalogApi {
  // Built-in pieces + the owner's uploaded pieces, ready for the racks.
  catalog: Product[];
  userProducts: Product[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
}

export function useCatalog(): CatalogApi {
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await listUserProducts();
      setUserProducts([...items].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your catalog.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addProduct = useCallback(
    async (product: Product) => {
      await saveUserProduct({
        ...product,
        source: "user",
        createdAt: product.createdAt ?? Date.now(),
      });
      await refresh();
    },
    [refresh]
  );

  const removeProduct = useCallback(
    async (id: string) => {
      await deleteUserProduct(id);
      await refresh();
    },
    [refresh]
  );

  const catalog = useMemo(() => [...userProducts, ...builtinProducts], [userProducts]);

  return { catalog, userProducts, loading, error, refresh, addProduct, removeProduct };
}