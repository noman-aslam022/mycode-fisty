import Reveal from "@/components/base/Reveal";
import { testimonials } from "@/mocks/testimonials";

export default function Testimonials() {
  return (
    <section id="reviews" className="relative w-full py-16 md:py-24 bg-background-100">
      <div className="w-full px-4 md:px-6 lg:px-10">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10 md:mb-14">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 font-label text-xs uppercase tracking-[0.22em] text-secondary-700 mb-4">
                <i className="ri-chat-smile-3-line"></i> The word on the street
              </span>
              <h2 className="font-heading font-extrabold text-4xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-foreground-950">
                38,000 fits later.
              </h2>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-background-50 border border-background-200 px-5 py-4">
              <span className="font-heading font-extrabold text-4xl text-foreground-950">4.9</span>
              <div>
                <div className="flex text-accent-500">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <i key={star} className="ri-star-fill text-sm"></i>
                  ))}
                </div>
                <p className="text-xs text-foreground-500 mt-0.5">Avg. rating · verified buyers</p>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {testimonials.map((item, i) => (
            <Reveal key={item.id} delay={(i % 4) * 80}>
              <figure className="h-full flex flex-col rounded-2xl bg-background-50 border border-background-200 p-6">
                <div className="flex text-accent-500 mb-4">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <i
                      key={s}
                      className={s < item.rating ? "ri-star-fill text-sm" : "ri-star-line text-sm text-foreground-300"}
                    ></i>
                  ))}
                </div>
                <blockquote className="text-base text-foreground-800 leading-relaxed flex-1">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <figcaption className="flex items-center gap-3 mt-6 pt-5 border-t border-background-200">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    title={`${item.name} — FITSY customer`}
                    className="w-11 h-11 rounded-full object-cover object-top"
                  />
                  <div>
                    <p className="font-heading font-bold text-sm text-foreground-950">{item.name}</p>
                    <p className="text-xs text-foreground-500">
                      {item.handle} · {item.location}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}