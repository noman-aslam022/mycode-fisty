import { useMemo, useState } from "react";
import Reveal from "@/components/base/Reveal";
import { products, type Product } from "@/mocks/products";

const examplePrompts = [
  "A good gift for my sister who loves vintage",
  "Cosy fits for a winter trip to the mountains",
  "Something bold for a festival this weekend",
  "A warm jacket under $150",
  "Accessories to level up a plain outfit",
];

function matchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  const tokens = q
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const scored = products
    .map((product) => {
      const haystack = `${product.name} ${product.category} ${product.tags.join(" ")}`.toLowerCase();
      let score = 0;
      tokens.forEach((token) => {
        if (haystack.includes(token)) score += 2;
        if (product.tags.some((tag) => tag.includes(token) || token.includes(tag))) score += 1;
      });
      if (/gift|present|birthday/.test(q) && product.tags.includes("gift")) score += 3;
      if (/warm|winter|cold|cosy|cozy/.test(q) && /warm|winter|cosy|cozy/.test(haystack)) score += 2;
      return { product, score };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored.filter((s) => s.score > 0).slice(0, 3);
  return (top.length >= 3 ? top : scored.slice(0, 3)).map((s) => s.product);
}

export default function AiStylistSection() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking" | "results">("idle");
  const [results, setResults] = useState<Product[]>([]);
  const [submitted, setSubmitted] = useState("");

  const run = (value: string) => {
    const text = value.trim();
    if (!text) return;
    setSubmitted(text);
    setQuery(text);
    setStatus("thinking");
    window.setTimeout(() => {
      setResults(matchProducts(text));
      setStatus("results");
    }, 1400);
  };

  const hint = useMemo(
    () => (submitted ? `Results curated for "${submitted}"` : "Describe it in your own words"),
    [submitted]
  );

  return (
    <section id="ai-stylist" className="relative w-full py-16 md:py-24 bg-background-100">
      <div className="w-full px-4 md:px-6 lg:px-10">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10 md:mb-14">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 font-label text-xs uppercase tracking-[0.22em] text-accent-700 mb-4">
                <i className="ri-sparkling-2-fill"></i> 01 — AI Stylist
              </span>
              <h2 className="font-heading font-extrabold text-4xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-foreground-950">
                Shop by vibe,
                <br />
                not by filter.
              </h2>
            </div>
            <p className="max-w-sm text-base md:text-lg text-foreground-600 leading-relaxed">
              Tell us who it&apos;s for or how you want to feel. Our stylist reads between the lines
              and pulls the exact pieces worth your money.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Input panel */}
          <Reveal className="lg:col-span-5" delay={80}>
            <div className="h-full rounded-3xl bg-foreground-950 p-6 md:p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-11 h-11 rounded-full bg-primary-500 flex items-center justify-center">
                  <i className="ri-magic-line text-foreground-950 text-xl"></i>
                </span>
                <div>
                  <p className="font-heading font-bold text-background-50">FITSY Stylist</p>
                  <p className="text-xs text-background-200/60">Powered by AI · always on</p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(query);
                }}
                className="flex flex-col gap-3"
              >
                <div className="relative">
                  <i className="ri-chat-quote-line absolute left-4 top-4 text-background-200/50 text-lg"></i>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    rows={3}
                    maxLength={300}
                    placeholder='"I need a good gift recommendation for my brother who loves streetwear..."'
                    className="w-full resize-none rounded-2xl bg-background-50/10 border border-background-50/15 text-background-50 placeholder:text-background-200/45 text-base leading-relaxed pl-11 pr-4 py-3.5 focus:outline-none focus:border-primary-500/60"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-primary-500 text-foreground-950 font-heading font-bold text-base hover:bg-primary-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-sparkling-2-fill text-lg"></i>
                  Style it for me
                </button>
              </form>

              <div className="mt-6">
                <p className="font-label text-[11px] uppercase tracking-[0.18em] text-background-200/50 mb-3">
                  Try one of these
                </p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => run(prompt)}
                      className="px-3.5 py-2 rounded-full bg-background-50/10 hover:bg-accent-500 hover:text-background-50 text-background-100 text-xs md:text-sm border border-background-50/10 transition-colors cursor-pointer text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Results panel */}
          <Reveal className="lg:col-span-7" delay={160}>
            <div className="h-full rounded-3xl bg-background-50 border border-background-200 p-6 md:p-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <p className="text-sm font-medium text-foreground-600">{hint}</p>
                {status === "results" && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-label uppercase tracking-[0.14em] text-secondary-700">
                    <i className="ri-check-double-line"></i> 3 picks
                  </span>
                )}
              </div>

              {status === "idle" && (
                <div className="flex flex-col items-center justify-center text-center py-12 md:py-20">
                  <span className="w-20 h-20 rounded-full bg-background-100 flex items-center justify-center mb-5 animate-float">
                    <i className="ri-sparkling-2-line text-4xl text-foreground-400"></i>
                  </span>
                  <p className="font-heading font-bold text-xl text-foreground-800">
                    Your personal edit appears here
                  </p>
                  <p className="text-sm text-foreground-500 mt-2 max-w-sm">
                    Ask for a gift, an outfit for an event, or a whole new look — the stylist handles
                    the rest.
                  </p>
                </div>
              )}

              {status === "thinking" && (
                <div className="flex flex-col items-center justify-center text-center py-12 md:py-20">
                  <span className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-5">
                    <i className="ri-loader-4-line text-4xl text-primary-700 animate-spin"></i>
                  </span>
                  <p className="font-heading font-bold text-xl text-foreground-800">
                    Styling your edit…
                  </p>
                  <p className="text-sm text-foreground-500 mt-2">
                    Reading the vibe and matching pieces
                  </p>
                </div>
              )}

              {status === "results" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-product-shop>
                  {results.map((product, i) => (
                    <div
                      key={product.id}
                      className="group rounded-2xl overflow-hidden border border-background-200 bg-background-100 animate-float-slow"
                      style={{ animationDelay: `${i * 150}ms` }}
                    >
                      <div className="relative w-full h-40 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          title={`${product.name} — AI recommended`}
                          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute top-2 left-2 px-2 py-1 rounded-full bg-foreground-950/80 text-background-50 text-[10px] font-label uppercase tracking-[0.12em]">
                          {product.category}
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="font-heading font-bold text-sm text-foreground-950 leading-snug line-clamp-2">
                          {product.name}
                        </p>
                        <p className="mt-1 font-heading font-extrabold text-lg text-foreground-950">
                          ${product.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}