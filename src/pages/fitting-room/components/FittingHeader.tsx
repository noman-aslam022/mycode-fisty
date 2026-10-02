import Reveal from "@/components/base/Reveal";

const specs = [
  { icon: "ri-stack-line", label: "1–3 pieces per pass" },
  { icon: "ri-vip-diamond-line", label: "Unlimited accessories" },
  { icon: "ri-lock-line", label: "Face & body locked" },
  { icon: "ri-shield-check-line", label: "Photo never stored" },
  { icon: "ri-drag-drop-line", label: "Import from any site" },
];

const protocol = [
  {
    icon: "ri-user-3-line",
    title: "Upload once",
    text: "A clear full-body photo. It stays private and is never stored on our servers.",
  },
  {
    icon: "ri-store-3-line",
    title: "Build the look",
    text: "One top, one bottom, a layer over it — plus endless accessories like glasses, hats and jewellery.",
  },
  {
    icon: "ri-magic-line",
    title: "Fit it & shop it",
    text: "Render the whole outfit onto you, then drop every piece into your bag in one tap.",
  },
];

export default function FittingHeader() {
  return (
    <section className="w-full px-4 md:px-6 lg:px-10 pb-10 md:pb-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
        <Reveal className="lg:col-span-7">
          <div>
            <span className="inline-flex items-center gap-2 font-label text-xs uppercase tracking-[0.22em] text-accent-700 mb-5">
              <i className="ri-sparkling-2-fill"></i> 03 — Virtual Fitting Room
            </span>
            <h1 className="font-heading font-extrabold text-[2.6rem] leading-[0.9] md:text-6xl lg:text-7xl tracking-tight text-foreground-950">
              The fitting room
              <br />
              that <span className="text-stroke">actually</span>
              <br />
              fits <span className="text-accent-600">you.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base md:text-lg text-foreground-600 leading-relaxed">
              Upload your photo once, then build the whole outfit — a top, a bottom and a layer over
              it, plus as many accessories as you want (or import a piece from anywhere) — and see it
              on you side-by-side with your original photo, powered by Bria&apos;s real virtual try-on.
              Your face, body, pose and background stay exactly the same — only the clothes change.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {specs.map((spec) => (
                <span
                  key={spec.label}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-background-100 border border-background-200 text-xs font-medium text-foreground-700"
                >
                  <i className={`${spec.icon} text-accent-600`}></i>
                  {spec.label}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal className="lg:col-span-5" delay={120}>
          <div className="relative">
            <div className="rounded-3xl bg-foreground-950 text-background-50 p-6 md:p-7">
              <div className="flex items-center justify-between mb-6">
                <p className="font-label text-[11px] uppercase tracking-[0.22em] text-background-200/60">
                  How it works
                </p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-500 text-foreground-950 text-[10px] font-label uppercase tracking-[0.14em]">
                  <i className="ri-flashlight-fill"></i> Live
                </span>
              </div>
              <ol className="space-y-5">
                {protocol.map((step, i) => (
                  <li key={step.title} className="flex items-start gap-4">
                    <span className="font-heading font-extrabold text-2xl text-primary-500 leading-none w-8 shrink-0">
                      0{i + 1}
                    </span>
                    <div>
                      <p className="font-heading font-bold text-base text-background-50">
                        {step.title}
                      </p>
                      <p className="text-sm text-background-200/60 mt-1 leading-relaxed">
                        {step.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <span className="hidden sm:inline-flex items-center gap-2 absolute -top-3 -right-2 md:-right-3 rotate-6 px-4 py-2 rounded-full bg-accent-500 text-background-50 font-heading font-bold text-sm">
              <i className="ri-magic-line"></i> AI try-on
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}