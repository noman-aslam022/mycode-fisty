interface MarqueeBandProps {
  words: string[];
  variant?: "dark" | "lime" | "orange";
}

export default function MarqueeBand({ words, variant = "dark" }: MarqueeBandProps) {
  const styles: Record<string, string> = {
    dark: "bg-foreground-950 text-background-50",
    lime: "bg-primary-500 text-foreground-950",
    orange: "bg-accent-500 text-background-50",
  };
  const iconColor: Record<string, string> = {
    dark: "text-primary-500",
    lime: "text-foreground-950",
    orange: "text-background-50",
  };

  return (
    <div className={`w-full overflow-hidden ${styles[variant]}`}>
      <div className="flex w-max animate-marquee">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex items-center" aria-hidden={dup === 1}>
            {words.map((word) => (
              <span key={`${dup}-${word}`} className="flex items-center">
                <span className="font-heading font-extrabold text-2xl md:text-4xl lg:text-5xl uppercase px-6 md:px-8 py-5 md:py-7 whitespace-nowrap">
                  {word}
                </span>
                <i className={`ri-asterisk text-xl md:text-3xl ${iconColor[variant]}`}></i>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}