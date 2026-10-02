import Reveal from "@/components/base/Reveal";
import { categories } from "@/mocks/categories";

const spans = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-7",
];

export default function CategorySection() {
  return (
    <section id="categories" className="relative w-full py-16 md:py-24 bg-background-100">
      <div className="w-full px-4 md:px-6 lg:px-10">
        <Reveal>
          <div className="max-w-3xl mb-10 md:mb-14">
            <span className="inline-flex items-center gap-2 font-label text-xs uppercase tracking-[0.22em] text-accent-700 mb-4">
              <i className="ri-layout-masonry-line"></i> Shop the edit
            </span>
            <h2 className="font-heading font-extrabold text-4xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-foreground-950">
              Find your lane.
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {categories.map((cat, i) => (
            <Reveal key={cat.id} className={spans[i]} delay={(i % 2) * 90}>
              <a
                href="#featured"
                className="group relative block w-full h-[320px] md:h-[420px] rounded-3xl overflow-hidden cursor-pointer"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  title={`${cat.name} — shop the collection`}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"></div>

                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-label text-xs uppercase tracking-[0.18em] text-background-200/80 mb-2">
                      {cat.count} pieces
                    </p>
                    <h3 className="font-heading font-extrabold text-3xl md:text-4xl text-background-50 leading-none">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-background-100/80 mt-2">{cat.blurb}</p>
                  </div>
                  <span className="w-12 h-12 rounded-full bg-background-50/90 text-foreground-950 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:rotate-45">
                    <i className="ri-arrow-right-up-line text-2xl"></i>
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}