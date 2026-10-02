interface StepBarProps {
  current: number;
}

const steps = [
  { n: 1, label: "Choose profile" },
  { n: 2, label: "Add a photo" },
  { n: 3, label: "Fitting room" },
];

export default function StepBar({ current }: StepBarProps) {
  return (
    <div className="w-full flex items-center justify-center gap-2 sm:gap-3">
      {steps.map((step, index) => {
        const done = step.n < current;
        const active = step.n === current;
        return (
          <div key={step.n} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  active
                    ? "bg-primary-500 text-foreground-950"
                    : done
                      ? "bg-foreground-950 text-background-50"
                      : "bg-background-200 text-foreground-600"
                }`}
              >
                {done ? <i className="ri-check-line"></i> : step.n}
              </span>
              <span
                className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                  active ? "text-foreground-950" : "text-foreground-600"
                } ${index === 0 ? "" : ""}`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <span className="w-6 sm:w-10 h-px bg-background-300" />
            )}
          </div>
        );
      })}
    </div>
  );
}