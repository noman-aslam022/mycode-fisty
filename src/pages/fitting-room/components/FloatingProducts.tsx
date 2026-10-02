import { useEffect, useMemo, useState } from "react";
import { useCatalog } from "@/pages/fitting-room/utils/catalogStore";

interface FloatingTile {
  className: string;
  rotate: string;
  delay: string;
  duration: string;
  parallax: number;
}

const TILES: FloatingTile[] = [
  { className: "left-[2%] top-[15%] w-28 lg:w-36", rotate: "-8deg", delay: "0s", duration: "5s", parallax: 0.14 },
  { className: "right-[2%] top-[13%] w-28 lg:w-36", rotate: "7deg", delay: "0.8s", duration: "6s", parallax: 0.1 },
  { className: "left-[5%] bottom-[14%] w-32 lg:w-40", rotate: "6deg", delay: "0.4s", duration: "5.5s", parallax: 0.18 },
  { className: "right-[5%] bottom-[15%] w-28 lg:w-36", rotate: "-6deg", delay: "1.2s", duration: "6.5s", parallax: 0.08 },
  { className: "hidden lg:block left-[17%] top-[5%] w-24 lg:w-28", rotate: "12deg", delay: "0.6s", duration: "5.2s", parallax: 0.2 },
  { className: "hidden lg:block right-[16%] bottom-[6%] w-24 lg:w-28", rotate: "-12deg", delay: "1s", duration: "5.8s", parallax: 0.16 },
  { className: "hidden xl:block left-[1%] top-[48%] w-24 lg:w-28", rotate: "4deg", delay: "0.3s", duration: "6.2s", parallax: 0.22 },
  { className: "hidden xl:block right-[1%] top-[46%] w-24 lg:w-28", rotate: "-5deg", delay: "1.4s", duration: "5.4s", parallax: 0.12 },
];

export default function FloatingProducts() {
  const { catalog } = useCatalog();
  const [scrollY, setScrollY] = useState(0);

  // The floating cards follow the catalog, so a new piece shows up here too.
  const picks = useMemo(() => catalog.filter((product) => Boolean(product?.image)), [catalog]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrollY(Math.min(window.scrollY, 640)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {TILES.map((tile, index) => {
        const item = picks[index];
        if (!item) return null;
        return (
          <div
            key={item.id}
            className={`absolute ${tile.className}`}
            style={{
              transform: `rotate(${tile.rotate}) translateY(${(-scrollY * tile.parallax).toFixed(1)}px)`,
            }}
          >
            <div
              className="animate-float"
              style={{ animationDelay: tile.delay, animationDuration: tile.duration }}
            >
              <div className="rounded-lg border border-background-200 bg-background-50 p-1.5 overflow-hidden">
                <div className="w-full aspect-[4/5] rounded-md overflow-hidden bg-background-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    title={`${item.name} — ${item.category}`}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <p className="mt-1.5 px-0.5 pb-0.5 text-[10px] font-label uppercase tracking-[0.1em] text-foreground-600 truncate">
                  {item.name}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
