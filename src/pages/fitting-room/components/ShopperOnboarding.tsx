import { useState } from "react";
import type { GenderArchetype, AgeStage, ShopperProfile } from "../types";

interface ShopperOnboardingProps {
  initialProfile?: ShopperProfile | null;
  onComplete: (profile: ShopperProfile) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

const GENDER_OPTIONS: {
  id: GenderArchetype;
  label: string;
  badge: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "women",
    label: "Women",
    badge: "Chic & Elevated",
    icon: "ri-women-line",
    description: "Contemporary silhouettes, outerwear, statement pieces & elevated street chic.",
  },
  {
    id: "men",
    label: "Men",
    badge: "Tailored & Street",
    icon: "ri-men-line",
    description: "Relaxed streetwear, tailored overcoats, smart chinos & modern casual cuts.",
  },
  {
    id: "all",
    label: "All / Unisex",
    badge: "Fluid & Versatile",
    icon: "ri-group-line",
    description: "Gender-neutral oversized hoodies, relaxed denim, accessories & versatile staples.",
  },
];

const AGE_OPTIONS: {
  id: AgeStage;
  label: string;
  badge: string;
  icon: string;
  subtitle: string;
  description: string;
}[] = [
  {
    id: "kids",
    label: "Kids & Youth",
    badge: "Ages 4–15",
    icon: "ri-bear-smile-line",
    subtitle: "Playful, Comfy & Active",
    description: "Colorful hoodies, sporty joggers, fleece bombers and easy-to-move-in pieces.",
  },
  {
    id: "adults",
    label: "Adults & Young Adults",
    badge: "Ages 16–50",
    icon: "ri-user-smile-line",
    subtitle: "Trend-Forward & Modern",
    description: "Statement streetwear, layered shackets, wide-leg trousers and contemporary cuts.",
  },
  {
    id: "seniors",
    label: "Classic & Mature Elegance",
    badge: "Ages 50+",
    icon: "ri-vip-crown-line",
    subtitle: "Timeless & Sophisticated",
    description: "Dignified, comfortable, premium knitwear, refined coats and relaxed tailored fits.",
  },
];

const STYLE_VIBES = [
  { id: "Streetwear", label: "Streetwear & Urban", icon: "ri-fire-line" },
  { id: "Smart Casual", label: "Smart Casual & Chic", icon: "ri-sparkling-line" },
  { id: "Relaxed Everyday", label: "Relaxed & Minimalist", icon: "ri-sun-line" },
  { id: "Timeless Classic", label: "Timeless & Elegant", icon: "ri-gemini-line" },
];

export default function ShopperOnboarding({
  initialProfile,
  onComplete,
  onCancel,
  isModal = false,
}: ShopperOnboardingProps) {
  const [gender, setGender] = useState<GenderArchetype>(initialProfile?.gender ?? "women");
  const [ageGroup, setAgeGroup] = useState<AgeStage>(initialProfile?.ageGroup ?? "adults");
  const [styleVibe, setStyleVibe] = useState<string>(
    initialProfile?.styleVibe ?? STYLE_VIBES[0].id
  );

  const handleSubmit = (overrideAll = false) => {
    if (overrideAll) {
      onComplete({ gender: "all", ageGroup: "all", styleVibe: "All Styles" });
      return;
    }
    onComplete({ gender, ageGroup, styleVibe });
  };

  const selectedGenderObj = GENDER_OPTIONS.find((g) => g.id === gender);
  const selectedAgeObj = AGE_OPTIONS.find((a) => a.id === ageGroup);

  const content = (
    <div className="w-full max-w-4xl mx-auto bg-background-50 rounded-3xl border border-background-200/80 shadow-2xl p-6 sm:p-8 md:p-10 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-background-200 pb-6 mb-8">
        <div>
          <span className="inline-flex items-center gap-2 font-label text-xs uppercase tracking-[0.22em] text-accent-700 mb-2">
            <i className="ri-magic-line"></i> Step 01 — Personalize Your Session
          </span>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl tracking-tight text-foreground-950">
            Who are we styling today?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-foreground-600 max-w-xl">
            Tell us about the shopper so we can curate the right wardrobe, silhouettes, and catalog
            for your virtual try-on.
          </p>
        </div>
        {isModal && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-10 h-10 rounded-full flex items-center justify-center text-foreground-500 hover:text-foreground-950 hover:bg-background-200 transition-colors"
            aria-label="Close"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        )}
      </div>

      <div className="space-y-8">
        {/* Step 1: Gender Archetype */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <label className="font-heading font-bold text-base sm:text-lg text-foreground-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-accent-600 text-background-50 text-xs font-bold flex items-center justify-center">
                1
              </span>
              Select Gender / Styling Archetype
            </label>
            <span className="text-xs font-medium text-foreground-500">Required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {GENDER_OPTIONS.map((opt) => {
              const active = gender === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGender(opt.id)}
                  className={`group relative text-left p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    active
                      ? "border-accent-600 bg-accent-50/60 shadow-md ring-2 ring-accent-400/20"
                      : "border-background-200 hover:border-background-300 bg-background-100/50 hover:bg-background-100"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-colors ${
                          active
                            ? "bg-accent-600 text-background-50 shadow-sm"
                            : "bg-background-200 text-foreground-700 group-hover:bg-background-300"
                        }`}
                      >
                        <i className={opt.icon}></i>
                      </span>
                      <span
                        className={`text-[10px] font-label uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          active
                            ? "bg-accent-200/80 text-accent-800 font-semibold"
                            : "bg-background-200 text-foreground-500"
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-base text-foreground-950 mb-1">
                      {opt.label}
                    </h3>
                    <p className="text-xs text-foreground-600 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-2 border-t border-background-200/60 text-xs font-medium">
                    <span className={active ? "text-accent-700 font-semibold" : "text-foreground-400"}>
                      {active ? "Selected" : "Click to choose"}
                    </span>
                    <i
                      className={`text-base ${
                        active
                          ? "ri-checkbox-circle-fill text-accent-600"
                          : "ri-checkbox-blank-circle-line text-foreground-300"
                      }`}
                    ></i>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Generation / Life Stage */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <label className="font-heading font-bold text-base sm:text-lg text-foreground-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-accent-600 text-background-50 text-xs font-bold flex items-center justify-center">
                2
              </span>
              Select Generation &amp; Life Stage
            </label>
            <span className="text-xs font-medium text-foreground-500">Curates fits &amp; cuts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {AGE_OPTIONS.map((opt) => {
              const active = ageGroup === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAgeGroup(opt.id)}
                  className={`group relative text-left p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    active
                      ? "border-accent-600 bg-accent-50/60 shadow-md ring-2 ring-accent-400/20"
                      : "border-background-200 hover:border-background-300 bg-background-100/50 hover:bg-background-100"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-colors ${
                          active
                            ? "bg-accent-600 text-background-50 shadow-sm"
                            : "bg-background-200 text-foreground-700 group-hover:bg-background-300"
                        }`}
                      >
                        <i className={opt.icon}></i>
                      </span>
                      <span
                        className={`text-[10px] font-label uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          active
                            ? "bg-accent-200/80 text-accent-800 font-semibold"
                            : "bg-background-200 text-foreground-500"
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-base text-foreground-950">
                      {opt.label}
                    </h3>
                    <p className="text-[11px] font-semibold text-accent-700 mb-1.5">
                      {opt.subtitle}
                    </p>
                    <p className="text-xs text-foreground-600 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-2 border-t border-background-200/60 text-xs font-medium">
                    <span className={active ? "text-accent-700 font-semibold" : "text-foreground-400"}>
                      {active ? "Selected" : "Click to choose"}
                    </span>
                    <i
                      className={`text-base ${
                        active
                          ? "ri-checkbox-circle-fill text-accent-600"
                          : "ri-checkbox-blank-circle-line text-foreground-300"
                      }`}
                    ></i>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Style Vibe */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="font-heading font-bold text-sm sm:text-base text-foreground-950 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-background-300 text-foreground-800 text-[11px] font-bold flex items-center justify-center">
                3
              </span>
              Preferred Styling Vibe (Optional)
            </label>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {STYLE_VIBES.map((vibe) => {
              const active = styleVibe === vibe.id;
              return (
                <button
                  key={vibe.id}
                  type="button"
                  onClick={() => setStyleVibe(vibe.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-foreground-950 text-background-50 shadow-sm"
                      : "bg-background-100 text-foreground-700 border border-background-200 hover:border-background-300"
                  }`}
                >
                  <i className={`${vibe.icon} ${active ? "text-primary-400" : "text-foreground-500"}`}></i>
                  <span>{vibe.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Curation Summary Banner */}
        <div className="rounded-2xl bg-secondary-900 text-background-50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xl shrink-0">
              <i className="ri-sparkling-fill"></i>
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-background-200/70 font-label">
                Curating Wardrobe
              </p>
              <p className="font-heading font-bold text-sm sm:text-base text-background-50">
                {selectedGenderObj?.label} &bull; {selectedAgeObj?.label} ({styleVibe})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-primary-500 text-foreground-950 font-heading font-bold text-sm hover:bg-primary-400 transition-all cursor-pointer shadow-lg hover:shadow-primary-500/20 whitespace-nowrap"
            >
              <span>Enter Fitting Room</span>
              <i className="ri-arrow-right-line text-base"></i>
            </button>
          </div>
        </div>

        {/* Skip option */}
        <div className="flex items-center justify-center gap-2 text-xs text-foreground-500 pt-2">
          <span>Just looking around?</span>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="underline underline-offset-2 font-medium text-accent-700 hover:text-accent-800 cursor-pointer"
          >
            Browse all catalogs without filtering
          </button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground-950/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4 sm:px-6">
      {content}
    </div>
  );
}
