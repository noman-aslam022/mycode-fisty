import { genderCovers } from "@/mocks/wardrobe";
import type { Gender } from "@/pages/fitting-room/types";

interface GenderPickerProps {
  value: Gender | null;
  onChange: (gender: Gender) => void;
}

const options: { id: Gender; label: string; blurb: string }[] = [
  { id: "men", label: "Men", blurb: "Menswear fits and tailoring" },
  { id: "women", label: "Women", blurb: "Womenswear cuts and silhouettes" },
  { id: "kids", label: "Kids", blurb: "Playful, comfy little fits" },
];

export default function GenderPicker({ value, onChange }: GenderPickerProps) {
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
            className={`group relative text-left rounded-lg border bg-background-50 overflow-hidden transition-all duration-300 hover:-translate-y-1 animate-scale-in cursor-pointer ${
              selected ? "border-primary-500" : "border-background-200 hover:border-foreground-300"
            }`}
          >
            <div className="relative w-full aspect-[4/3] sm:aspect-[4/5] bg-background-100 overflow-hidden">
              <img
                src={genderCovers[option.id]}
                alt={`${option.label} wardrobe on Fitsy`}
                title={`Style the ${option.label.toLowerCase()} wardrobe`}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-foreground-950/70 to-transparent" />
              {selected && (
                <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary-500 text-foreground-950 flex items-center justify-center">
                  <i className="ri-check-line"></i>
                </span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-heading font-semibold text-lg text-foreground-950">{option.label}</h3>
              <p className="mt-1 text-sm text-foreground-600 leading-relaxed">{option.blurb}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}