import { Link } from "react-router-dom";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import Reveal from "@/components/feature/Reveal";
import FloatingProducts from "@/pages/fitting-room/components/FloatingProducts";
import { genderCovers } from "@/mocks/wardrobe";

const steps = [
  {
    n: "01",
    icon: "ri-user-settings-line",
    title: "Pick your profile",
    text: "Choose men, women or kids, then your age group so the wardrobe matches you.",
  },
  {
    n: "02",
    icon: "ri-image-add-line",
    title: "Add a photo",
    text: "Upload a clear full or half-body shot. It stays on your device in preview mode.",
  },
  {
    n: "03",
    icon: "ri-magic-line",
    title: "Build & preview",
    text: "Slide through torso, pants, jackets and more, then see the whole look on your photo.",
  },
];

const profiles = [
  { id: "men", label: "Men", text: "Tailoring, knitwear and everyday staples." },
  { id: "women", label: "Women", text: "Silhouettes, skirts and statement layers." },
  { id: "kids", label: "Kids", text: "Comfy, playful fits made to move in." },
];

export default function FittingRoomLanding() {
  return (
    <div className="min-h-screen w-full bg-background-50 overflow-x-hidden">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative w-full overflow-hidden bg-background-50">
          <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[44rem] h-[44rem] rounded-full bg-primary-100/60 blur-3xl animate-float" />
          <div className="pointer-events-none absolute -bottom-52 right-0 w-[34rem] h-[34rem] rounded-full bg-accent-100/50 blur-3xl animate-float" style={{ animationDuration: "6s" }} />
          <FloatingProducts />

          <div className="relative z-10 w-full px-4 md:px-8 pt-32 md:pt-44 pb-20 md:pb-32 flex flex-col items-center text-center">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-background-300 bg-background-50/70 backdrop-blur text-[11px] font-label uppercase tracking-[0.24em] text-foreground-700 animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              <span className="w-2 h-2 rounded-full bg-primary-500" />
              AI virtual fitting room
            </span>

            <h1
              className="mt-7 font-heading font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.02] tracking-tight text-foreground-950 max-w-4xl animate-fade-up"
              style={{ animationDelay: "90ms" }}
            >
              Try it on,
              <br />
              before you <span className="text-accent-500">buy it.</span>
            </h1>

            <p
              className="mt-6 max-w-xl text-base md:text-lg text-foreground-600 leading-relaxed animate-fade-up"
              style={{ animationDelay: "180ms" }}
            >
              Set up your profile, drop in a photo, and watch our wardrobe dress you in
              seconds — torso, pants, jackets and more, all in one place.
            </p>

            <div
              className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-fade-up"
              style={{ animationDelay: "270ms" }}
            >
              <Link
                to="/fitting-room/setup"
                className="shine inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-primary-500 text-foreground-950 font-semibold text-base hover:bg-primary-600 hover:-translate-y-0.5 transition-all whitespace-nowrap cursor-pointer"
              >
                <i className="ri-magic-line text-lg"></i>
                Try Fitting Room
                <i className="ri-arrow-right-line"></i>
              </Link>
              <a
                href="#how"
                className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full border border-foreground-950/20 text-foreground-950 font-semibold text-base hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                See how it works
              </a>
            </div>

            <div
              className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 animate-fade-up"
              style={{ animationDelay: "360ms" }}
            >
              {[
                { icon: "ri-t-shirt-line", label: "Torso, pants & jackets" },
                { icon: "ri-shopping-bag-3-line", label: "Shop the whole look" },
                { icon: "ri-lock-2-line", label: "Photo stays on device" },
              ].map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 text-sm text-foreground-600"
                >
                  <i className={`${item.icon} text-primary-600 text-lg`}></i>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="w-full bg-background-100 border-y border-background-200">
          <div className="w-full px-4 md:px-8 py-16 md:py-24">
            <Reveal className="max-w-2xl">
              <span className="text-[11px] font-label uppercase tracking-[0.24em] text-secondary-600">
                Three easy steps
              </span>
              <h2 className="mt-3 font-heading font-bold text-3xl md:text-5xl tracking-tight text-foreground-950">
                From photo to full fit in under a minute
              </h2>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {steps.map((step, index) => (
                <Reveal key={step.n} delay={index * 110}>
                  <div className="h-full rounded-lg border border-background-200 bg-background-50 p-6 md:p-7 transition-transform duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <span className="w-12 h-12 rounded-full bg-foreground-950 text-background-50 flex items-center justify-center">
                        <i className={`${step.icon} text-xl`}></i>
                      </span>
                      <span className="font-heading font-bold text-3xl text-background-300">
                        {step.n}
                      </span>
                    </div>
                    <h3 className="mt-6 font-heading font-semibold text-xl text-foreground-950">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-foreground-600 leading-relaxed">{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Built for everyone */}
        <section className="w-full bg-background-50">
          <div className="w-full px-4 md:px-8 py-16 md:py-24">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-xl">
                <span className="text-[11px] font-label uppercase tracking-[0.24em] text-secondary-600">
                  Built for everyone
                </span>
                <h2 className="mt-3 font-heading font-bold text-3xl md:text-5xl tracking-tight text-foreground-950">
                  A wardrobe for every body
                </h2>
              </div>
              <Link
                to="/fitting-room/setup"
                className="hidden md:inline-flex items-center gap-2 h-12 px-6 rounded-full border border-foreground-950 text-foreground-950 text-sm font-semibold hover:bg-foreground-950 hover:text-background-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                Start styling
                <i className="ri-arrow-right-line"></i>
              </Link>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              {profiles.map((profile, index) => (
                <Reveal key={profile.id} delay={index * 120}>
                  <Link
                    to="/fitting-room/setup"
                    className="group relative block rounded-lg border border-background-200 bg-background-50 overflow-hidden"
                  >
                    <div className="relative w-full aspect-[4/5] bg-background-100 overflow-hidden">
                      <img
                        src={genderCovers[profile.id as keyof typeof genderCovers]}
                        alt={`${profile.label} wardrobe on Fitsy`}
                        title={`Style the ${profile.label.toLowerCase()} wardrobe`}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-foreground-950/75 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <h3 className="font-heading font-bold text-xl text-background-50">
                          {profile.label}
                        </h3>
                        <p className="mt-1 text-xs text-background-200/80">{profile.text}</p>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full px-4 md:px-8 pb-16 md:pb-24">
          <Reveal>
            <div className="relative rounded-lg bg-foreground-950 overflow-hidden">
              <div className="pointer-events-none absolute -top-24 -right-16 w-[28rem] h-[28rem] rounded-full bg-primary-500/20 blur-3xl" />
              <div className="relative w-full px-6 md:px-16 py-14 md:py-20 flex flex-col items-center text-center">
                <h2 className="font-heading font-bold text-3xl md:text-5xl tracking-tight text-background-50 max-w-2xl">
                  Ready to see it on you?
                </h2>
                <p className="mt-4 max-w-lg text-sm md:text-base text-background-200/80">
                  No changing rooms, no guesswork. Just your photo and a wardrobe that fits.
                </p>
                <Link
                  to="/fitting-room/setup"
                  className="shine mt-8 inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-primary-500 text-foreground-950 font-semibold hover:bg-primary-600 hover:-translate-y-0.5 transition-all whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-magic-line text-lg"></i>
                  Try Fitting Room
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}