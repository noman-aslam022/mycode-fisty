import { useEffect, useRef } from "react";
import Reveal from "@/components/base/Reveal";

const HERO_VIDEO_SRC = "https://assets.mixkit.co/videos/50641/50641-720.mp4";
const HERO_POSTER_SRC = "https://assets.mixkit.co/videos/50641/50641-thumb-720-0.jpg";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const video = videoRef.current;
    let duration = 0;
    let target = 0;
    let current = 0;

    const onMeta = () => {
      if (video) duration = video.duration || 0;
    };
    if (video) {
      if (video.readyState >= 1) onMeta();
      else video.addEventListener("loadedmetadata", onMeta);
      video.pause();
    }

    let raf = 0;
    let running = false;

    const render = () => {
      const el = sectionRef.current;
      if (!el) {
        running = false;
        return;
      }
      const rect = el.getBoundingClientRect();
      const height = rect.height || 1;
      const p = Math.min(Math.max(-rect.top / height, 0), 1);

      if (bgRef.current) {
        bgRef.current.style.transform = `translate3d(0, ${p * 130}px, 0) scale(${1 + p * 0.14})`;
      }
      if (bloomRef.current) {
        bloomRef.current.style.transform = `translate3d(0, ${p * -90}px, 0)`;
      }
      if (contentRef.current) {
        contentRef.current.style.transform = `translate3d(0, ${p * -50}px, 0) rotateX(${p * 7}deg) scale(${1 - p * 0.04})`;
        contentRef.current.style.opacity = `${1 - p * 0.55}`;
      }
      if (chipsRef.current) {
        chipsRef.current.style.transform = `translate3d(0, ${p * -170}px, 0)`;
        chipsRef.current.style.opacity = `${Math.max(1 - p * 1.4, 0)}`;
      }
      if (cueRef.current) {
        cueRef.current.style.opacity = `${Math.max(1 - p * 2.2, 0)}`;
      }

      // Scroll-scrubbed video: page scroll drives playback position.
      if (video && duration > 0) {
        target = p * duration * 0.95;
        current += (target - current) * 0.18;
        if (Math.abs(target - current) > 0.02 && video.seekable.length > 0) {
          video.currentTime = current;
        }
      }

      raf = requestAnimationFrame(render);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting;
        if (visible && !running) {
          running = true;
          raf = requestAnimationFrame(render);
        } else if (!visible && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 },
    );

    if (sectionRef.current) io.observe(sectionRef.current);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      if (video) video.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-[88vh] lg:min-h-screen overflow-hidden flex items-center"
      style={{ perspective: "1400px" }}
    >
      {/* Background video — deepest parallax layer, scrubbed by scroll */}
      <div
        ref={bgRef}
        className="absolute inset-0 will-change-transform"
        style={{ transformOrigin: "center top" }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover object-top pointer-events-none"
          poster={HERO_POSTER_SRC}
          muted
          playsInline
          preload="auto"
          aria-label="FITSY new season campaign film — model in a fashion studio"
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/55"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/25"></div>
      </div>

      {/* Soft light bloom — mid layer */}
      <div
        ref={bloomRef}
        className="absolute -top-24 right-[10%] w-[420px] h-[420px] rounded-full bg-primary-500/20 blur-3xl pointer-events-none will-change-transform hidden lg:block"
      ></div>

      {/* Content — tilts back in 3D as you scroll */}
      <div className="relative z-10 w-full">
        <div
          ref={contentRef}
          className="w-full px-4 md:px-6 lg:px-10 pt-32 pb-16 md:pt-40 md:pb-24 will-change-transform"
          style={{ transformOrigin: "center top" }}
        >
          <div className="max-w-6xl">
            <Reveal>
              <div className="inline-flex items-center gap-2 pl-2 pr-4 py-2 rounded-full bg-background-50/15 backdrop-blur-md border border-background-50/25 mb-6">
                <span className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                  <i className="ri-sparkling-2-fill text-foreground-950 text-xs"></i>
                </span>
                <span className="font-label text-xs md:text-sm uppercase tracking-[0.2em] text-background-50">
                  AI Styling + Virtual Try-On
                </span>
              </div>
            </Reveal>

            <h1 className="font-heading font-extrabold text-background-50 leading-[0.92] tracking-[-0.02em] text-5xl sm:text-6xl md:text-8xl lg:text-[7.5rem] text-left">
              <Reveal delay={80}>
                <span className="block">WEAR THE</span>
              </Reveal>
              <Reveal delay={180}>
                <span className="block">
                  <span className="text-stroke-cream">FUTURE</span>{" "}
                  <span className="inline-block align-middle">
                    <span className="inline-flex w-12 h-12 md:w-20 md:h-20 rounded-full bg-primary-500 text-foreground-950 items-center justify-center align-middle animate-float">
                      <i className="ri-arrow-right-up-line text-2xl md:text-4xl"></i>
                    </span>
                  </span>
                </span>
              </Reveal>
            </h1>

            <Reveal delay={260}>
              <p className="mt-6 md:mt-8 max-w-xl text-base md:text-xl text-background-100/90 leading-relaxed">
                Describe what you want. We&apos;ll find it. Upload a photo. See it on you.
                FITSY is the next-gen store where AI shops with you — not for you.
              </p>
            </Reveal>

            <Reveal delay={340}>
              <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href="#featured"
                  className="group inline-flex items-center justify-center gap-3 py-4 px-8 rounded-full bg-primary-500 text-foreground-950 font-heading font-bold text-lg hover:bg-primary-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Shop the new drop
                  <i className="ri-arrow-right-line text-xl transition-transform duration-300 group-hover:translate-x-1"></i>
                </a>
                <a
                  href="#ai-stylist"
                  className="inline-flex items-center justify-center gap-3 py-4 px-8 rounded-full bg-background-50/10 backdrop-blur-md border border-background-50/30 text-background-50 font-heading font-bold text-lg hover:bg-background-50/20 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-magic-line text-xl"></i>
                  Ask the AI Stylist
                </a>
              </div>
            </Reveal>

            {/* Stats */}
            <Reveal delay={420}>
              <div className="mt-12 md:mt-16 flex flex-wrap items-center gap-x-10 gap-y-5">
                {[
                  { value: "1.2M+", label: "happy fits shipped" },
                  { value: "4.9★", label: "from 38k reviews" },
                  { value: "Free", label: "AI try-on previews" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col">
                    <span className="font-heading font-extrabold text-3xl md:text-4xl text-background-50">
                      {stat.value}
                    </span>
                    <span className="font-label text-xs uppercase tracking-[0.16em] text-background-200/70 mt-1">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Floating tags — fastest parallax layers */}
      <div
        ref={chipsRef}
        className="hidden lg:flex absolute right-10 bottom-24 z-10 flex-col items-end gap-3 will-change-transform"
      >
        <div className="inline-flex items-center gap-3 pl-3 pr-5 py-3 rounded-2xl bg-background-50/95 backdrop-blur-md animate-float">
          <span className="w-11 h-11 rounded-xl bg-accent-500 flex items-center justify-center">
            <i className="ri-t-shirt-2-line text-background-50 text-xl"></i>
          </span>
          <span className="flex flex-col">
            <span className="font-heading font-bold text-sm text-foreground-950">Try it on you</span>
            <span className="text-xs text-foreground-500">One photo. Instant preview.</span>
          </span>
        </div>
        <div className="inline-flex items-center gap-3 pl-3 pr-5 py-3 rounded-2xl bg-primary-500 animate-float-slow">
          <i className="ri-sparkling-2-fill text-foreground-950 text-xl"></i>
          <span className="font-heading font-bold text-sm text-foreground-950">
            Gift finder: just describe them
          </span>
        </div>
      </div>

      {/* Scroll cue */}
      <div
        ref={cueRef}
        className="hidden md:flex absolute left-1/2 -translate-x-1/2 bottom-8 z-10 items-center gap-2 text-background-100/80 will-change-transform"
      >
        <span className="font-label text-[11px] uppercase tracking-[0.24em]">Scroll</span>
        <i className="ri-arrow-down-line animate-float"></i>
      </div>
    </section>
  );
}