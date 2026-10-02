import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import Reveal from "@/components/base/Reveal";
import type { Product } from "@/mocks/products";
import { useCatalog } from "@/pages/fitting-room/utils/catalogStore";
import ProductForm from "./components/ProductForm";
import ProductList from "./components/ProductList";

export default function CatalogManager() {
  const { catalog, userProducts, loading, error, refresh, addProduct, removeProduct } =
    useCatalog();
  const [editing, setEditing] = useState<Product | null>(null);
  const [toast, setToast] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const onModelCount = useMemo(
    () => userProducts.filter((p) => p.onModel).length,
    [userProducts]
  );

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const handleSave = async (product: Product) => {
    const isEdit = Boolean(editing);
    await addProduct(product);
    setEditing(null);
    showToast(isEdit ? "Piece updated" : "Piece added to your catalog");
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await removeProduct(pendingDelete.id);
    if (editing?.id === pendingDelete.id) setEditing(null);
    setPendingDelete(null);
    showToast("Piece removed");
  };

  return (
    <div className="min-h-screen w-full bg-background-50 overflow-x-hidden">
      <Navbar />

      <main className="pt-28 md:pt-32">
        <section className="w-full px-4 md:px-6 lg:px-10 pb-8 md:pb-10">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-2 font-label text-xs uppercase tracking-[0.22em] text-accent-700 mb-4">
                  <i className="ri-folders-line"></i> Catalog manager
                </span>
                <h1 className="font-heading font-extrabold text-4xl md:text-6xl tracking-tight text-foreground-950">
                  Your own
                  <br />
                  <span className="text-accent-600">catalog.</span>
                </h1>
                <p className="mt-5 max-w-xl text-base text-foreground-600 leading-relaxed">
                  Upload your pieces — name, price, category and photo. On-model shots are
                  detected automatically and the garment is isolated, so the try-on only ever sees
                  the clothes, never the model.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl bg-background-100 border border-background-200 px-5 py-4">
                  <p className="font-heading font-extrabold text-3xl text-foreground-950">
                    {userProducts.length}
                  </p>
                  <p className="font-label text-[11px] uppercase tracking-[0.16em] text-foreground-500">
                    Your pieces
                  </p>
                </div>
                <div className="rounded-2xl bg-secondary-100 border border-secondary-200 px-5 py-4">
                  <p className="font-heading font-extrabold text-3xl text-secondary-900">
                    {onModelCount}
                  </p>
                  <p className="font-label text-[11px] uppercase tracking-[0.16em] text-secondary-900/70">
                    Auto-tagged on-model
                  </p>
                </div>
                <Link
                  to="/fitting-room"
                  className="self-stretch inline-flex items-center gap-2 px-5 rounded-2xl bg-primary-500 text-foreground-950 font-heading font-bold hover:bg-primary-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-magic-line text-lg"></i> Try them on
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="w-full px-4 md:px-6 lg:px-10 pb-14 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <ProductForm
                  editing={editing}
                  onSave={handleSave}
                  onCancel={() => setEditing(null)}
                />
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-heading font-bold text-xl text-foreground-950">
                  In your catalog
                </h2>
                <span className="font-label text-[11px] uppercase tracking-[0.16em] text-foreground-500">
                  {catalog.length} total with built-ins
                </span>
              </div>
              <ProductList
                products={userProducts}
                loading={loading}
                error={error}
                onEdit={(product) => {
                  setEditing(product);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onDelete={(id) => {
                  const found = userProducts.find((p) => p.id === id) ?? null;
                  setPendingDelete(found);
                }}
                onRetry={() => void refresh()}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Delete confirmation */}
      {pendingDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground-950/50 backdrop-blur-sm"
            onClick={() => setPendingDelete(null)}
          ></div>
          <div className="relative w-full max-w-sm rounded-3xl bg-background-50 border border-background-200 p-6">
            <span className="w-11 h-11 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center mb-4">
              <i className="ri-delete-bin-6-line text-xl"></i>
            </span>
            <h3 className="font-heading font-bold text-lg text-foreground-950">
              Remove this piece?
            </h3>
            <p className="mt-1.5 text-sm text-foreground-600">
              &ldquo;{pendingDelete.name}&rdquo; will be taken out of your catalog and the fitting
              room.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="flex-1 h-11 rounded-xl bg-background-100 border border-background-200 text-foreground-800 font-medium hover:border-foreground-300 transition-colors cursor-pointer whitespace-nowrap"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="flex-1 h-11 rounded-xl bg-accent-500 text-background-50 font-medium hover:bg-accent-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-3 rounded-full bg-foreground-950 text-background-50 px-5 py-3">
          <i className="ri-check-line text-primary-500 text-lg"></i>
          <span className="text-sm font-medium whitespace-nowrap">{toast}</span>
        </div>
      )}
    </div>
  );
}