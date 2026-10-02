import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import type { Product } from "@/mocks/products";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useCatalog } from "./utils/catalogStore";
import { fileToDownscaledDataUrl, fetchImageAsDataUrl, MAX_UPLOAD_BYTES } from "./utils/image";
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
  compositeTryOnResult,
  type PoseReference,
} from "./utils/masking";
import { extractGarmentReference } from "./utils/garmentExtract";
import type { BagItem, ImportedGarment, OutfitEntry, OutfitSlot, ShopperProfile, TryOnStatus } from "./types";
import ShopperOnboarding from "./components/ShopperOnboarding";
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
  const { catalog } = useCatalog();

  const [photo, setPhoto] = useState<string | null>(null);
  const [look, setLook] = useState<OutfitEntry[]>([]);
  const deepLinkId = searchParams.get("product");
  const deepLinkApplied = useRef(false);

  useEffect(() => {
    if (!deepLinkId || deepLinkApplied.current) return;
    const found = catalog.find((p) => p.id === deepLinkId);
    if (!found) return;
    deepLinkApplied.current = true;
    setLook((prev) =>
      prev.some((entry) => entry.kind === "catalog" && entry.product.id === found.id)
        ? prev
        : [...prev, catalogEntry(found, found.colors[0])]
    );
  }, [catalog, deepLinkId]);

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
  const [shopperProfile, setShopperProfile] = useState<ShopperProfile | null>(() => {
    try {
      const stored = localStorage.getItem("vestra_shopper_profile");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isConfiguringProfile, setIsConfiguringProfile] = useState(false);

  const colorOf = useCallback(
    (product: Product) => colors[product.id] ?? product.colors[0],
    [colors]
  );

  const lookIds = useMemo(
    () =>
      look
        .filter(
          (
            entry
          ): entry is {
            kind: "catalog";
            id: string;
            slot: Product["slot"];
            product: Product;
            color: string;
          } => entry.kind === "catalog"
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
      // Analyze geometry and store the pose reference to lock face, posture and body.
      try {
        const pose = await analyzePersonPhoto(dataUrl);
        setPoseRef(pose);
      } catch {
        setPoseRef(null);
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
        prev.filter(
          (entry) => !(entry.kind === "catalog" && entry.product.id === product.id)
        )
      );
      return;
    }

    // Top / Bottom / Layer hold one piece — adding a new one swaps the old out.
    if (isSingleSlot(product.slot)) {
      const hadOne = look.some(
        (entry) => entry.slot === product.slot && entry.kind === "catalog"
      );
      setLook((prev) => [
        ...prev.filter((entry) => entry.slot !== product.slot),
        catalogEntry(product, color),
      ]);
      if (hadOne) {
        showToast(
          `Swapped your ${SLOT_META[product.slot].short.toLowerCase()} for ${product.name}`
        );
      }
      return;
    }

    setLook((prev) => [...prev, catalogEntry(product, color)]);
  };

  const selectColor = (productId: string, hex: string) => {
    setColors((prev) => ({ ...prev, [productId]: hex }));
    setLook((prev) =>
      prev.map((entry) =>
        entry.kind === "catalog" && entry.product.id === productId
          ? { ...entry, color: hex }
          : entry
      )
    );
  };

  const addImported = (garment: ImportedGarment, slot?: OutfitSlot) => {
    const targetSlot = slot ?? garment.slot ?? "accessory";
    if (isSingleSlot(targetSlot)) {
      setLook((prev) => [
        ...prev.filter((entry) => entry.slot !== targetSlot),
        {
          kind: "imported",
          id: garment.id,
          slot: targetSlot,
          garment: { ...garment, slot: targetSlot },
        },
      ]);
      showToast(`Added custom piece as ${SLOT_META[targetSlot].label}`);
      return;
    }
    setLook((prev) => [
      ...prev,
      {
        kind: "imported",
        id: garment.id,
        slot: targetSlot,
        garment: { ...garment, slot: targetSlot },
      },
    ]);
    showToast(`Added custom piece as ${SLOT_META[targetSlot].label}`);
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
    if (!isSupabaseConfigured) {
      setError(
        "Try-on isn't connected yet. Connect your backend, deploy the bria-tryon function, and set BRIA_API_KEY."
      );
      setStatus("error");
      return;
    }

    setNeedPhoto(false);
    setError("");
    setResultUrl(null);
    setStatus("generating");

    const groups = batchLook(look);
    // `composed` is the running result. Every batch is blended back onto it
    // using only that batch's clothing region, so the person, face, pose and
    // background stay anchored to the ORIGINAL photo at every step — even when
    // several products are fitted one after another.
    let composed = photo;

    let currentPose = poseRef;
    if (!currentPose && photo) {
      try {
        currentPose = await analyzePersonPhoto(photo);
        setPoseRef(currentPose);
      } catch {
        currentPose = null;
      }
    }

    try {
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        setProgress(
          groups.length > 1
            ? `Pass ${i + 1} of ${groups.length} — preparing ${group.length} ${
                group.length === 1 ? "piece" : "pieces"
              }…`
            : "Preparing your pieces…"
        );

        // Extract a human-free garment reference for every piece first, so the
        // try-on engine never copies a model's face or pose from the product
        // photo — it only ever receives the garment itself. Once a user product
        // was auto-tagged at upload, we reuse that clean cut-out directly.
        const garmentImages = await Promise.all(
          group.map((entry) => {
            if (entry.kind === "catalog" && entry.product.garmentRef) {
              return Promise.resolve(entry.product.garmentRef);
            }
            return extractGarmentReference(entrySource(entry), entry.slot, {
              onModel: entry.kind === "catalog" ? entry.product.onModel : undefined,
            });
          })
        );

        setProgress(
          groups.length > 1
            ? `Pass ${i + 1} of ${groups.length} — fitting ${group.length} ${
                group.length === 1 ? "piece" : "pieces"
              }…`
            : "Fitting your look…"
        );
        const { data, error: fnError } = await supabase.functions.invoke("bria-tryon", {
          body: {
            personImage: composed,
            garmentImages,
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
              "The try-on service has reached its free quota. Please add credits or update the BRIA_API_KEY."
            );
          }
          throw new Error(errorMessage || "The try-on service failed.");
        }
        const payload = data as {
          imageUrl?: string;
          imageDataUrl?: string;
          error?: string;
        } | null;
        if (payload?.error) {
          if (payload.error === "free_limit_reached") {
            throw new Error(
              "The try-on service has reached its free quota. Please add credits or update the BRIA_API_KEY."
            );
          }
          throw new Error(payload.error);
        }

        // Resolve the fitted image to an INLINE data URL before compositing.
        // The blend below must read the image's pixels, and a cross-origin
        // image the browser refuses to expose would make that blend fail and
        // fall back to the raw AI frame — the exact frame where a model's face
        // and pose can leak. Inline data always blends.
        let generatedRef = payload?.imageDataUrl || "";
        if (!generatedRef && payload?.imageUrl) {
          try {
            generatedRef = await fetchImageAsDataUrl(payload.imageUrl);
          } catch (dlErr) {
            console.warn("Direct download failed, trying backend proxy:", dlErr);
          }
        }
        if (!generatedRef && payload?.imageUrl) {
          try {
            const { data: proxyData } = await supabase.functions.invoke("bria-tryon", {
              body: { action: "download", url: payload.imageUrl },
            });
            generatedRef =
              (proxyData as { imageDataUrl?: string } | null)?.imageDataUrl || "";
          } catch (proxyErr) {
            console.warn("Backend image proxy failed:", proxyErr);
          }
        }
        if (!generatedRef) {
          throw new Error("No image was returned. Please try again.");
        }

        // Lock your face, pose and background: only the garment region of the
        // AI frame is ever used. We refuse to show a raw AI frame, so if the
        // mask cannot be built we stop rather than alter your appearance.
        if (!currentPose) {
          throw new Error(
            "We could not read the body in your photo. Please upload a clear, full-body photo and try again."
          );
        }
        const batchMask = await generateOutfitMask(currentPose, group);
        if (!batchMask) {
          throw new Error("We could not prepare the fit. Please try again.");
        }
        composed = await compositeTryOnResult(composed, generatedRef, batchMask);
      }

      setResultUrl(composed);
      setStatus("done");
      setProgress("");
    } catch (e) {
      setProgress("");
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }, [look, photo, poseRef]);

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
    showToast(`${look.length} ${look.length === 1 ? "piece" : "pieces"} added to your bag`);
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

  // If the user has not completed the onboarding questions (gender, age group), show onboarding first
  if (!shopperProfile) {
    return (
      <div className="min-h-screen w-full bg-background-50 overflow-x-hidden">
        <Navbar />
        <main className="pt-28 md:pt-36 pb-16">
          <ShopperOnboarding
            onComplete={(p) => {
              setShopperProfile(p);
              try {
                localStorage.setItem("vestra_shopper_profile", JSON.stringify(p));
              } catch {
                // ignore
              }
            }}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background-50 overflow-x-hidden">
      <Navbar />

      <main className="pt-28 md:pt-32">
        <FittingHeader
          shopperProfile={shopperProfile}
          onEditProfile={() => setIsConfiguringProfile(true)}
        />

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
          products={catalog}
          lookIds={lookIds}
          colorOf={colorOf}
          onSelectColor={selectColor}
          onToggle={toggleCatalog}
          busy={status === "generating"}
          hasPhoto={Boolean(photo)}
          shopperProfile={shopperProfile}
          onEditProfile={() => setIsConfiguringProfile(true)}
        />
      </main>

      {/* Edit Profile Modal */}
      {isConfiguringProfile && (
        <ShopperOnboarding
          initialProfile={shopperProfile}
          isModal
          onComplete={(p) => {
            setShopperProfile(p);
            setIsConfiguringProfile(false);
            try {
              localStorage.setItem("vestra_shopper_profile", JSON.stringify(p));
            } catch {
              // ignore
            }
          }}
          onCancel={() => setIsConfiguringProfile(false)}
        />
      )}

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