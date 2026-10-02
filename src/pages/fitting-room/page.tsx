import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import { products, type Product } from "@/mocks/products";
import { supabase } from "@/lib/supabase";
import { fileToDownscaledDataUrl, MAX_UPLOAD_BYTES } from "./utils/image";
import {
  batchInstruction,
  batchLook,
  entrySource,
  isSingleSlot,
  slotOfProduct,
  SLOT_META,
} from "./utils/outfit";
import { bagCount, bagItemsFromLook, mergeBag } from "./utils/bag";
import {
  analyzePersonPhoto,
  generateOutfitMask,
  cleanUpTryOnResult,
  type PoseReference,
} from "./utils/masking";
import type { BagItem, ImportedGarment, OutfitEntry, TryOnStatus } from "./types";
import FittingHeader from "./components/FittingHeader";
import PhotoPanel from "./components/PhotoPanel";
import TryOnStage from "./components/TryOnStage";
import OutfitTray from "./components/OutfitTray";
import CatalogGrid from "./components/CatalogGrid";
import BagDrawer from "./components/BagDrawer";

function catalogEntry(product: Product, color: string): OutfitEntry {
  return { kind: "catalog", id: product.id, slot: slotOfProduct(product), product, color };
}

const studioSteps = ["01 Upload", "02 Stage", "03 Look", "04 Shop"];

export default function FittingRoom() {
  const [searchParams] = useSearchParams();
  const stageRef = useRef<HTMLDivElement>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [look, setLook] = useState<OutfitEntry[]>(() => {
    // Deep link (?product=p-001) drops that piece straight into the look.
    const id = searchParams.get("product");
    const found = products.find((p) => p.id === id) ?? null;
    return found ? [catalogEntry(found, found.colors[0])] : [];
  });
  // Per-product colour pick, keyed by product id (falls back to first colour).
  const [colors, setColors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<TryOnStatus>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [poseRef, setPoseRef] = useState<PoseReference | null>(null);
  const [error, setError] = useState("");
  const [needPhoto, setNeedPhoto] = useState(false);
  const [progress, setProgress] = useState("");
  const [toast, setToast] = useState("");
  const [bag, setBag] = useState<BagItem[]>([]);
  const [bagOpen, setBagOpen] = useState(false);

  const colorOf = useCallback(
    (product: Product) => colors[product.id] ?? product.colors[0],
    [colors]
  );

  const lookIds = useMemo(
    () =>
      look
        .filter(
          (entry): entry is { kind: "catalog"; id: string; slot: Product["slot"]; product: Product; color: string } =>
            entry.kind === "catalog"
        )
        .map((entry) => entry.product.id),
    [look]
  );

  const batches = useMemo(() => batchLook(look), [look]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const handlePhoto = async (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose a JPG or PNG image.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That image is a bit large — please use one under 12MB.");
      return;
    }
    try {
      const dataUrl = await fileToDownscaledDataUrl(file);
      setPhoto(dataUrl);
      setNeedPhoto(false);
      setResultUrl(null);
      setStatus("idle");
      // Analyze geometry and store pose reference to lock face, posture and body
      try {
        const pose = await analyzePersonPhoto(dataUrl);
        setPoseRef(pose);
      } catch {
        // Fallback gracefully
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load that image.");
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPoseRef(null);
    setResultUrl(null);
    setStatus("idle");
    setError("");
  };

  const toggleCatalog = (product: Product) => {
    const color = colorOf(product);
    const exists = look.some(
      (entry) => entry.kind === "catalog" && entry.product.id === product.id
    );

    if (exists) {
      setLook((prev) =>
        prev.filter((entry) => !(entry.kind === "catalog" && entry.product.id === product.id))
      );
      return;
    }

    // Top / Bottom / Layer hold one piece — adding a new one swaps the old out.
    if (isSingleSlot(product.slot)) {
      const hadOne = look.some((entry) => entry.slot === product.slot && entry.kind === "catalog");
      setLook((prev) => [
        ...prev.filter((entry) => entry.slot !== product.slot),
        catalogEntry(product, color),
      ]);
      if (hadOne) {
        showToast(`Swapped your ${SLOT_META[product.slot].short.toLowerCase()} for ${product.name}`);
      }
      return;
    }

    setLook((prev) => [...prev, catalogEntry(product, color)]);
  };

  const selectColor = (productId: string, hex: string) => {
    setColors((prev) => ({ ...prev, [productId]: hex }));
    // Keep any already-picked piece in sync with its new colour.
    setLook((prev) =>
      prev.map((entry) =>
        entry.kind === "catalog" && entry.product.id === productId ? { ...entry, color: hex } : entry
      )
    );
  };

  const addImported = (garment: ImportedGarment) => {
    setLook((prev) => [
      ...prev,
      { kind: "imported", id: garment.id, slot: "accessory", garment },
    ]);
    showToast("Imported piece added to your look");
  };

  const removeEntry = (id: string) => {
    setLook((prev) => prev.filter((entry) => entry.id !== id));
  };

  const clearAll = () => {
    setLook([]);
  };

  const renderLook = useCallback(async () => {
    if (look.length === 0) {
      setError("Add at least one piece to your look first.");
      return;
    }
    if (!photo) {
      setNeedPhoto(true);
      setError("Upload your photo first — then fit your whole look.");
      return;
    }

    setNeedPhoto(false);
    setError("");
    setResultUrl(null);
    setStatus("generating");

    const groups = batchLook(look);
    const basePhoto = photo;
    let personImage = photo;
    let lastUrl = "";

    // Ensure we have analyzed the pose/geometry to protect face and body
    let currentPose = poseRef;
    if (!currentPose && photo) {
      try {
        currentPose = await analyzePersonPhoto(photo);
        setPoseRef(currentPose);
      } catch {
        // Fallback
      }
    }

    try {
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        setProgress(
          groups.length > 1
            ? `Pass ${i + 1} of ${groups.length} — fitting ${group.length} ${
                group.length === 1 ? "piece" : "pieces"
              }…`
            : ""
        );

        // Generate dynamic mask for this outfit pass (clothing/accessory white, face/body black)
        let maskImage: string | undefined = undefined;
        if (currentPose) {
          try {
            maskImage = await generateOutfitMask(currentPose, group);
          } catch {
            // Fallback
          }
        }

        const garmentImages = group.map(entrySource);
        const { data, error: fnError } = await supabase.functions.invoke("bria-tryon", {
          body: {
            personImage,
            garmentImages,
            maskImage,
            instruction: batchInstruction(group),
          },
        });

        if (fnError) {
          let errorMessage = fnError.message;
          try {
            const ctx = (fnError as { context?: Response }).context;
            if (ctx && typeof ctx.json === "function") {
              const errorBody = await ctx.clone().json();
              if (errorBody?.error) {
                errorMessage = errorBody.error;
              }
            }
          } catch {
            // ignore
          }

          if (errorMessage === "free_limit_reached") {
            throw new Error(
              "Bria AI free quota reached ('free_limit_reached'). Your Bria API key in Supabase has exhausted its free credits. Please add credits or update your BRIA_API_KEY in Supabase secrets."
            );
          }
          throw new Error(errorMessage || "The try-on service failed.");
        }
        const payload = data as { imageUrl?: string; error?: string } | null;
        if (payload?.error) {
          if (payload.error === "free_limit_reached") {
            throw new Error(
              "Bria AI free quota reached ('free_limit_reached'). Your Bria API key in Supabase has exhausted its free credits. Please add credits or update your BRIA_API_KEY in Supabase secrets."
            );
          }
          throw new Error(payload.error);
        }
        if (!payload?.imageUrl) throw new Error("No image was returned. Please try again.");

        let finalImageUrl = payload.imageUrl;
        if (basePhoto) {
          try {
            // Clean up the image: preserves the user's authentic camera face/eyes
            // while keeping the newly fitted clothing, shoes, and background clean with zero cutouts.
            finalImageUrl = await cleanUpTryOnResult(basePhoto, payload.imageUrl, currentPose);
          } catch (compErr) {
            console.warn("Cleanup fallback:", compErr);
          }
        }

        lastUrl = finalImageUrl;
        // Chain: layer the next batch onto this result.
        personImage = finalImageUrl;
      }

      setResultUrl(lastUrl);
      setStatus("done");
      setProgress("");
    } catch (e) {
      setProgress("");
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }, [look, photo]);

  const handleFit = () => {
    void renderLook();
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const shopLook = () => {
    if (look.length === 0) {
      showToast("Add a few pieces to your look first");
      return;
    }
    setBag((prev) => mergeBag(prev, bagItemsFromLook(look)));
    setBagOpen(true);
    showToast(
      `${look.length} ${look.length === 1 ? "piece" : "pieces"} added to your bag`
    );
  };

  const changeBagQty = (id: string, color: string | undefined, delta: number) => {
    setBag((prev) =>
      prev.map((item) =>
        item.id === id && item.color === color
          ? { ...item, qty: Math.max(1, item.qty + delta) }
          : item
      )
    );
  };

  const removeBagItem = (id: string, color: string | undefined) => {
    setBag((prev) => prev.filter((item) => !(item.id === id && item.color === color)));
  };

  const cartCount = bagCount(bag);

  return (
    <div className="min-h-screen w-full bg-background-50 overflow-x-hidden">
      <Navbar />

      <main className="pt-28 md:pt-32">
        <FittingHeader />

        {/* Studio console — photo + stage grouped into one dark booth */}
        <section className="w-full px-4 md:px-6 lg:px-10 pb-10 md:pb-14">
          <div
            ref={stageRef}
            className="scroll-mt-28 rounded-[28px] md:rounded-[36px] bg-foreground-950 p-3 md:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-2 md:px-3 pb-3 md:pb-4">
              <span className="inline-flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-70 animate-ping"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary-500"></span>
                </span>
                <span className="font-label text-[11px] uppercase tracking-[0.24em] text-background-200/70">
                  Live studio
                </span>
              </span>
              <div className="hidden sm:flex flex-wrap items-center gap-1.5">
                {studioSteps.map((step) => (
                  <span
                    key={step}
                    className="px-3 py-1 rounded-full border border-background-50/15 text-[11px] font-label uppercase tracking-[0.14em] text-background-200/70 whitespace-nowrap"
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
              <div className="lg:col-span-5">
                <PhotoPanel
                  photo={photo}
                  onPhoto={handlePhoto}
                  onClear={clearPhoto}
                  highlight={needPhoto}
                />
              </div>
              <div className="lg:col-span-7">
                <TryOnStage
                  photo={photo}
                  entries={look}
                  status={status}
                  resultUrl={resultUrl}
                  error={error}
                  progress={progress}
                  onRetry={renderLook}
                  onShopLook={shopLook}
                />
              </div>
            </div>
          </div>
        </section>

        <OutfitTray
          look={look}
          onRemove={removeEntry}
          onClearAll={clearAll}
          onImport={addImported}
          onFit={handleFit}
          onShopLook={shopLook}
          busy={status === "generating"}
          hasPhoto={Boolean(photo)}
          count={look.length}
          batches={batches.length}
        />

        <CatalogGrid
          lookIds={lookIds}
          colorOf={colorOf}
          onSelectColor={selectColor}
          onToggle={toggleCatalog}
          busy={status === "generating"}
          hasPhoto={Boolean(photo)}
        />
      </main>

      <Footer />

      <BagDrawer
        open={bagOpen}
        items={bag}
        onClose={() => setBagOpen(false)}
        onChangeQty={changeBagQty}
        onRemove={removeBagItem}
        onCheckout={() => showToast("Checkout is coming soon")}
      />

      {cartCount > 0 && !bagOpen && (
        <button
          type="button"
          onClick={() => setBagOpen(true)}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 h-14 pl-4 pr-5 rounded-full bg-foreground-950 text-background-50 hover:bg-foreground-800 transition-colors cursor-pointer whitespace-nowrap"
        >
          <span className="relative flex items-center justify-center w-7 h-7">
            <i className="ri-shopping-bag-3-line text-xl"></i>
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary-500 text-foreground-950 text-[11px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          </span>
          <span className="text-sm font-medium">View bag</span>
        </button>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 rounded-full bg-foreground-950 text-background-50 px-5 py-3 animate-float-slow">
          <i className="ri-check-line text-primary-500 text-lg"></i>
          <span className="text-sm font-medium whitespace-nowrap">{toast}</span>
        </div>
      )}
    </div>
  );
}