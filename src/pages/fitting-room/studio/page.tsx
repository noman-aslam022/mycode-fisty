import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import Reveal from "@/components/feature/Reveal";
import StudioStage from "@/pages/fitting-room/components/StudioStage";
import LookRail from "@/pages/fitting-room/components/LookRail";
import WardrobeSlider from "@/pages/fitting-room/components/WardrobeSlider";
import CategoryTabs, {
  type CategoryFilter,
  type CategoryTab,
} from "@/pages/fitting-room/components/CategoryTabs";
import { useFittingRoom } from "@/pages/fitting-room/context";
import { AGE_LABELS, GENDER_LABELS } from "@/pages/fitting-room/types";
import { useCatalog } from "@/pages/fitting-room/utils/catalogStore";
import type { PoseReference } from "@/pages/fitting-room/utils/masking";
import { fitLook, type FitEngine } from "@/pages/fitting-room/utils/tryOn";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  byCategory,
  garmentsForProfile,
  resolveAudience,
  type StudioGarment,
  type WardrobeCategory,
} from "@/pages/fitting-room/utils/wardrobe";

const emptyLook: Record<WardrobeCategory, string[]> = {
  torso: [],
  pants: [],
  jackets: [],
  footwear: [],
  accessories: [],
};

type FitStatus = "idle" | "generating" | "done" | "error";

export default function FittingRoomStudio() {
  const navigate = useNavigate();
  const { gender, age, photo, reset } = useFittingRoom();
  const { catalog, loading, error, refresh } = useCatalog();

  const [look, setLook] = useState<Record<WardrobeCategory, string[]>>(emptyLook);
  const [status, setStatus] = useState<FitStatus>("idle");
  const [progress, setProgress] = useState("");
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [zoomed, setZoomed] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [engine, setEngine] = useState<FitEngine | null>(null);
  const [engineNote, setEngineNote] = useState("");
  const [fitError, setFitError] = useState("");
  const [showOriginal, setShowOriginal] = useState(false);
  const [poseRef, setPoseRef] = useState<PoseReference | null>(null);
  const fitRun = useRef(0);

  const ready = Boolean(gender && age && photo);

  // The racks are the catalog itself — every piece saved on /catalog shows up here.
  const items = useMemo(
    () => garmentsForProfile(catalog, gender, age),
    [catalog, gender, age]
  );
  const audience = resolveAudience(gender, age);

  const garmentIndex = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const lookItems = useMemo(
    () =>
      CATEGORY_ORDER.flatMap((category) => look[category])
        .map((id) => garmentIndex.get(id))
        .filter((item): item is StudioGarment => Boolean(item)),
    [look, garmentIndex]
  );

  const tabs: CategoryTab[] = useMemo(() => {
    const totalCount = items.length;
    const totalSelected = CATEGORY_ORDER.reduce((sum, category) => sum + look[category].length, 0);
    const allTab: CategoryTab = { key: "all", count: totalCount, selected: totalSelected };
    const categoryTabs: CategoryTab[] = CATEGORY_ORDER.map((category) => ({
      key: category,
      count: byCategory(items, category).length,
      selected: look[category].length,
    }));
    return [allTab, ...categoryTabs];
  }, [items, look]);

  const visibleCategories: WardrobeCategory[] =
    filter === "all" ? CATEGORY_ORDER : [filter];

  /* Close the enlarged view on Escape, and lock background scroll while open. */
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [zoomed]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const toggle = (category: WardrobeCategory, item: StudioGarment) => {
    setLook((prev) => {
      const current = prev[category];
      const exists = current.includes(item.id);
      if (CATEGORY_META[category].single) {
        return { ...prev, [category]: exists ? [] : [item.id] };
      }
      return {
        ...prev,
        [category]: exists ? current.filter((id) => id !== item.id) : [...current, item.id],
      };
    });
    invalidateFit();
  };

  const removeItem = (id: string) => {
    setLook((prev) => {
      const next = { ...prev };
      CATEGORY_ORDER.forEach((category) => {
        next[category] = next[category].filter((entry) => entry !== id);
      });
      return next;
    });
    invalidateFit();
  };

  const clearLook = () => {
    setLook(emptyLook);
    invalidateFit();
  };

  const pickRandom = <T,>(arr: T[]): T | undefined =>
    arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined;

  const surpriseMe = () => {
    const picked: Record<WardrobeCategory, string[]> = {
      torso: [],
      pants: [],
      jackets: [],
      footwear: [],
      accessories: [],
    };
    let pieces = 0;
    CATEGORY_ORDER.forEach((category) => {
      const pool = byCategory(items, category);
      const choice = pickRandom(pool);
      if (choice) {
        picked[category] = [choice.id];
        pieces += 1;
      }
    });
    if (pieces === 0) {
      showToast("No pieces available for this wardrobe yet");
      return;
    }
    setLook(picked);
    invalidateFit();
    showToast(`Styled a full outfit · ${pieces} pieces — tweak any you like`);
  };

  const selectCategory = (category: CategoryFilter) => {
    setFilter(category);
  };

  // Any change to the look or the photo invalidates the previous render.
  const invalidateFit = () => {
    // Bumping the run id makes any fit still in flight discard its result, so a
    // slow render can never land on top of a look the shopper has since changed.
    fitRun.current += 1;
    setStatus("idle");
    setResult(null);
    setEngine(null);
    setEngineNote("");
    setFitError("");
    setShowOriginal(false);
  };

  const applyFit = async () => {
    if (lookItems.length === 0) {
      showToast("Add at least one piece to your look first");
      return;
    }
    if (!photo) return;

    fitRun.current += 1;
    const run = fitRun.current;
    setStatus("generating");
    setResult(null);
    setFitError("");
    setEngineNote("");
    setProgress("Starting…");

    try {
      const outcome = await fitLook({
        photo,
        garments: lookItems,
        poseRef,
        onProgress: (message) => {
          if (fitRun.current === run) setProgress(message);
        },
        onPose: setPoseRef,
      });
      if (fitRun.current !== run) return;
      setResult(outcome.image);
      setEngine(outcome.engine);
      setEngineNote(outcome.note);
      setStatus("done");
      setProgress("");
      showToast(
        outcome.engine === "ai"
          ? `Fitted ${outcome.passes === 1 ? "your look" : `your look in ${outcome.passes} passes`}`
          : "Studio preview applied to your photo"
      );
    } catch (err) {
      if (fitRun.current !== run) return;
      setProgress("");
      setFitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  // A new photo makes the previous render meaningless.
  useEffect(() => {
    setPoseRef(null);
    invalidateFit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);

  const shopLook = () => {
    if (lookItems.length === 0) return;
    showToast(`${lookItems.length} ${lookItems.length === 1 ? "piece" : "pieces"} added to your bag`);
  };

  const startOver = () => {
    reset();
    navigate("/fitting-room/setup");
  };

  const audienceLabel =
    audience === "kids"
      ? "Kids wardrobe"
      : `${GENDER_LABELS[gender ?? "men"]} + unisex pieces`;

  return (
    <div className="min-h-screen w-full bg-background-50 overflow-x-clip">
      <Navbar />

      <main className="w-full px-4 md:px-8 pt-24 md:pt-28 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto">
          {!ready ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="max-w-md w-full text-center rounded-lg border border-background-200 bg-background-50 p-8 md:p-10 animate-fade-up">
                <span className="mx-auto w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                  <i className="ri-magic-line text-3xl"></i>
                </span>
                <h1 className="mt-6 font-heading font-bold text-2xl text-foreground-950">
                  Let's set up your fitting room
                </h1>
                <p className="mt-3 text-sm text-foreground-600 leading-relaxed">
                  Pick your profile and add a photo first — then your wardrobe and studio
                  appear right here.
                </p>
                <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                  <Link
                    to="/fitting-room/setup"
                    className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-md bg-primary-500 text-foreground-950 font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-user-settings-line"></i>
                    Choose profile
                  </Link>
                  <Link
                    to="/fitting-room"
                    className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md border border-background-300 text-foreground-800 font-semibold hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-arrow-left-line"></i>
                    Back
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Studio bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 animate-fade-up">
                <Link
                  to="/fitting-room/upload"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-background-300 text-sm font-semibold text-foreground-800 hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-arrow-left-line"></i>
                  Change photo
                </Link>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-foreground-950 text-background-50 text-xs font-medium whitespace-nowrap">
                    <i className="ri-user-line"></i>
                    {gender ? GENDER_LABELS[gender] : "—"}
                  </span>
                  <span className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-secondary-100 text-secondary-900 text-xs font-medium whitespace-nowrap">
                    <i className="ri-calendar-line"></i>
                    {age ? AGE_LABELS[age] : "—"}
                  </span>
                  <button
                    type="button"
                    onClick={startOver}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-background-300 text-sm font-semibold text-foreground-800 hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-restart-line"></i>
                    Start over
                  </button>
                </div>
              </div>

              {/* Studio workspace: sticky stage + look | scrolling picker */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* Sticky studio */}
                <aside className="w-full lg:col-span-5">
                  <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:flex lg:flex-col lg:gap-4">
                    {photo && (
                      <div className="lg:flex-1 lg:min-h-0">
                        <StudioStage
                          photo={photo}
                          selected={lookItems}
                          status={status}
                          progress={progress}
                          result={result}
                          engine={engine}
                          engineNote={engineNote}
                          error={fitError}
                          showOriginal={showOriginal}
                          onToggleOriginal={() => setShowOriginal((prev) => !prev)}
                          onRetry={applyFit}
                          expandable={status === "done"}
                          onExpand={() => setZoomed(true)}
                        />
                      </div>
                    )}
                    <div className="mt-5 lg:mt-0 lg:shrink-0">
                      <LookRail
                        lookItems={lookItems}
                        onRemove={removeItem}
                        onClear={clearLook}
                        onFit={applyFit}
                        onShop={shopLook}
                        busy={status === "generating"}
                        failed={status === "error"}
                      />
                    </div>
                  </div>
                </aside>

                {/* Product picker */}
                <section className="w-full lg:col-span-7" data-product-shop>
                  <Reveal>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-label uppercase tracking-[0.24em] text-secondary-600">
                          Step 03 · Build the look
                        </span>
                        <h2 className="mt-3 font-heading font-bold text-2xl md:text-4xl tracking-tight text-foreground-950">
                          Your wardrobe
                        </h2>
                        <p className="mt-2 text-sm text-foreground-600">
                          {loading
                            ? "Loading pieces from your catalog…"
                            : `${items.length} ${items.length === 1 ? "piece" : "pieces"} from your catalog`}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to="/catalog"
                          className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-background-300 text-sm font-semibold text-foreground-800 hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <i className="ri-add-line"></i>
                          Add to catalog
                        </Link>
                        <button
                          type="button"
                          onClick={surpriseMe}
                          disabled={loading || items.length === 0}
                          className="shine inline-flex items-center gap-2 h-10 px-4 rounded-full bg-accent-500 text-background-50 text-sm font-semibold hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <i className="ri-magic-line text-base"></i>
                          Surprise me
                        </button>
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-100 text-accent-900 text-xs font-medium whitespace-nowrap">
                          <i className="ri-filter-3-line"></i>
                          {audienceLabel}
                        </span>
                      </div>
                    </div>
                  </Reveal>

                  {error ? (
                    <div className="mt-6 rounded-lg border border-background-200 bg-background-100 p-6 text-center">
                      <i className="ri-error-warning-line text-3xl text-accent-500"></i>
                      <p className="mt-3 font-heading font-bold text-foreground-950">
                        We couldn&apos;t load your catalog
                      </p>
                      <p className="mt-1 text-sm text-foreground-500">{error}</p>
                      <button
                        type="button"
                        onClick={() => void refresh()}
                        className="mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-full bg-foreground-950 text-background-50 text-sm font-medium hover:bg-foreground-800 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-refresh-line"></i> Try again
                      </button>
                    </div>
                  ) : loading ? (
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-background-200 bg-background-100 overflow-hidden animate-pulse"
                        >
                          <div className="w-full aspect-[4/5] bg-background-200"></div>
                          <div className="p-2.5 space-y-2">
                            <div className="h-2.5 w-1/3 rounded bg-background-200"></div>
                            <div className="h-3 w-2/3 rounded bg-background-200"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : items.length === 0 ? (
                    <div className="mt-6 rounded-lg border-2 border-dashed border-background-300 bg-background-50 p-10 text-center">
                      <span className="w-14 h-14 rounded-full bg-background-100 flex items-center justify-center mx-auto mb-4">
                        <i className="ri-shirt-line text-2xl text-foreground-600"></i>
                      </span>
                      <p className="font-heading font-bold text-foreground-950">
                        No pieces for this profile yet
                      </p>
                      <p className="mt-1 text-sm text-foreground-500 max-w-sm mx-auto">
                        Add a piece to your catalog and it appears on these racks instantly —
                        tagged to the right rail by its category.
                      </p>
                      <Link
                        to="/catalog"
                        className="mt-5 inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary-500 text-foreground-950 font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-add-line"></i> Open catalog
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="mt-6">
                        <CategoryTabs tabs={tabs} active={filter} onSelect={selectCategory} />
                      </div>

                      <div className="flex flex-col gap-10 md:gap-12">
                        {visibleCategories.map((category, index) => (
                          <div
                            key={category}
                            className="scroll-mt-36 lg:scroll-mt-40"
                          >
                            <Reveal delay={Math.min(index * 40, 120)}>
                              <WardrobeSlider
                                category={category}
                                items={byCategory(items, category)}
                                selectedIds={look[category]}
                                onToggle={toggle}
                              />
                            </Reveal>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      {zoomed && photo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged look preview"
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground-950/90 backdrop-blur-sm p-4 md:p-8 animate-fade-in cursor-zoom-out"
        >
          <button
            type="button"
            aria-label="Close enlarged view"
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 md:top-6 md:right-6 z-10 w-11 h-11 rounded-full bg-background-50/90 text-foreground-950 flex items-center justify-center hover:bg-background-50 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl"></i>
          </button>

          <figure
            onClick={(event) => event.stopPropagation()}
            className="relative max-w-3xl w-full max-h-[90vh] rounded-lg overflow-hidden bg-background-100 animate-pop cursor-default"
          >
            <img
              src={showOriginal || !result ? photo : result}
              alt="Your enlarged fitting room look"
              title={showOriginal || !result ? "Your original photo" : "Your fitted look"}
              className="w-full max-h-[90vh] object-contain"
            />
            <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-t from-foreground-950/85 to-transparent">
              <span className="text-xs font-label uppercase tracking-[0.16em] text-background-50/90">
                {showOriginal || !result
                  ? "Original photo"
                  : engine === "ai"
                    ? "AI try-on"
                    : "Studio preview"}
              </span>
              {result && (
                <button
                  type="button"
                  onClick={() => setShowOriginal((prev) => !prev)}
                  className="text-[11px] font-semibold text-background-50 whitespace-nowrap hover:underline cursor-pointer"
                >
                  {showOriginal ? "Show try-on" : "Show original"}
                </button>
              )}
              <span className="text-[11px] text-background-200/80 whitespace-nowrap">
                Click outside or press Esc to close
              </span>
            </figcaption>
          </figure>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 rounded-full bg-foreground-950 text-background-50 px-5 py-3 animate-pop">
          <i className="ri-check-line text-primary-500 text-lg"></i>
          <span className="text-sm font-medium whitespace-nowrap">{toast}</span>
        </div>
      )}
    </div>
  );
}