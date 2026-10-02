import type { AgeGroup } from "@/pages/fitting-room/types";

interface AgePickerProps {
  value: AgeGroup | null;
  onChange: (age: AgeGroup) => void;
}

const options: { id: AgeGroup; label: string; range: string; blurb: string; icon: string }[] = [
  {
    id: "adult",
    label: "Adult",
    range: "18 – 59",
    blurb: "Grown-up fits for everyday and going out",
    icon: "ri-user-line",
  },
  {
    id: "child",
    label: "Child",
    range: "Under 12",
    blurb: "Comfy, colourful and easy-to-wear pieces",
    icon: "ri-emotion-happy-line",
  },
  {
    id: "old",
    label: "Old",
    range: "60+",
    blurb: "Relaxed, comfortable and timeless styling",
    icon: "ri-user-heart-line",
  },
];

export default function AgePicker({ value, onChange }: AgePickerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5">
      {options.map((option, index) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            style={{ animationDelay: `${index * 90}ms` }}
            className={`flex items-start gap-4 text-left rounded-lg border p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 animate-scale-in cursor-pointer ${
              selected
                ? "border-primary-500 bg-primary-50"
                : "border-background-200 bg-background-50 hover:border-foreground-300"
            }`}
          >
            <span
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                selected ? "bg-primary-500 text-foreground-950" : "bg-background-100 text-foreground-700"
              }`}
            >
              <i className={`${option.icon} text-xl`}></i>
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-semibold text-base text-foreground-950">
                  {option.label}
                </h3>
                <span className="font-label text-[10px] uppercase tracking-[0.14em] text-foreground-500">
                  {option.range}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground-600 leading-relaxed">{option.blurb}</p>
            </div>
            {selected && <i className="ri-checkbox-circle-fill text-primary-600 ml-auto shrink-0"></i>}
          </button>
        );
      })}
    </div>
  );
}