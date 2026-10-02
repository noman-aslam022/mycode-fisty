import { CATEGORY_META, type WardrobeCategory } from "@/pages/fitting-room/utils/wardrobe";

export type CategoryFilter = WardrobeCategory | "all";

export interface CategoryTab {
  key: CategoryFilter;
  count: number;
  selected: number;
}

interface CategoryTabsProps {
  tabs: CategoryTab[];
  active: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
}

const ALL_META = { icon: "ri-apps-2-line", label: "All" };

export default function CategoryTabs({ tabs, active, onSelect }: CategoryTabsProps) {
  return (
    <div className="sticky top-20 lg:top-24 z-20 -mx-1 px-1 py-2 bg-background-50/85 backdrop-blur">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const meta = tab.key === "all" ? ALL_META : CATEGORY_META[tab.key];
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelect(tab.key)}
              className={`shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-full border text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-foreground-950 bg-foreground-950 text-background-50"
                  : "border-background-300 bg-background-50 text-foreground-700 hover:border-foreground-400"
              }`}
            >
              <i className={`${meta.icon} text-base`}></i>
              {meta.label}
              <span
                className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-primary-500 text-foreground-950"
                    : "bg-background-200 text-foreground-700"
                }`}
              >
                {tab.selected > 0 ? tab.selected : tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}