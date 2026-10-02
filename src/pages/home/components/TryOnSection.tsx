import { Link } from "react-router-dom";
import Reveal from "@/components/base/Reveal";
import { products } from "@/mocks/products";

const previewPieces = [products[6], products[0], products[11], products[2]];

const highlights = [
  { icon: "ri-user-3-line", label: "Upload your photo once" },
  { icon: "ri-store-3-line", label: "Try on the whole store" },
  { icon: "ri-loop-right-line", label: "Switch pieces instantly" },
];

export default function TryOnSection() {
  return (
    <section id="try-on" className="relative w-full py-16 md:py-24 bg-foreground-950 overflow-hidden">
      <div className="w-full px-4 md:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <Reveal className="lg:col-span-6">
            <div>
              <span className="inline-flex items-center gap-2 font-label text-xs uppercase tracking-[0.22em] text-primary-400 mb-4">
                <i className="ri-sparkling-2-fill"></i> 02 — Virtual Fitting Room
              </span>
              <h2 className="font-heading font-extrabold text-4xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-background-50">
                See it on you.
                <br />
                For real this time.
              </h2>
              <p className="mt-5 max-w-lg text-base md:text-lg text-background-200/70 leading-relaxed">
                A proper full-screen fitting room powered by Bria&apos;s real virtual try-on. Upload
                your photo once, then try on the entire catalog — the real garment, composited onto
                you, in seconds.
              </p>

              <div className="mt-8 flex flex-col gap-3">
                {highlights.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-background-50/10 flex items-center justify-center text-primary-400 shrink-0">
                      <i className={item.icon}></i>
                    </span>
                    <span className="text-background-100">{item.label}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/fitting-room"
                className="mt-9 inline-flex items-center gap-2 px-7 py-4 rounded-full bg-primary-500 text-foreground-950 font-heading font-bold text-lg hover:bg-primary-400 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-magic-line text-xl"></i> Enter the fitting room
              </Link>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-6" delay={120}>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {previewPieces.map((piece, i) => (
                <div
                  key={piece.id}
                  className={`relative rounded-2xl overflow-hidden border border-background-50/10 ${
                    i % 2 === 0 ? "mt-0" : "mt-6"
                  }`}
                >
                  <div className="w-full aspect-[4/5]">
                    <img
                      src={piece.image}
                      alt={piece.name}
                      title={`${piece.name} — available in the fitting room`}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-background-50/90 backdrop-blur text-foreground-950 text-xs font-label uppercase tracking-[0.12em]">
                    Try it on
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}