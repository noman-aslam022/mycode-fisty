import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/feature/Navbar";
import Reveal from "@/components/feature/Reveal";
import StepBar from "@/pages/fitting-room/components/StepBar";
import UploadDropzone from "@/pages/fitting-room/components/UploadDropzone";
import { useFittingRoom } from "@/pages/fitting-room/context";
import { sampleModelFor } from "@/pages/fitting-room/utils/wardrobe";

const tips = [
  "Face the camera straight on, full or half body.",
  "Use even, natural light — avoid harsh shadows.",
  "Keep the background plain so you stand out.",
  "Wear fitted clothing so layers read clearly.",
];

export default function FittingRoomUpload() {
  const navigate = useNavigate();
  const { gender, age, photo, setPhoto } = useFittingRoom();
  const ready = Boolean(gender && age);

  useEffect(() => {
    if (!ready) navigate("/fitting-room/setup", { replace: true });
  }, [ready, navigate]);

  return (
    <div className="min-h-screen w-full bg-background-50 overflow-x-hidden">
      <Navbar />

      <main className="w-full px-4 md:px-8 pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto">
          <StepBar current={2} />

          <div className="mt-10 md:mt-14 text-center max-w-2xl mx-auto animate-fade-up">
            <span className="text-[11px] font-label uppercase tracking-[0.24em] text-secondary-600">
              Step 02 · Your photo
            </span>
            <h1 className="mt-3 font-heading font-bold text-3xl md:text-5xl tracking-tight text-foreground-950">
              Add a photo to style
            </h1>
            <p className="mt-4 text-sm md:text-base text-foreground-600 leading-relaxed">
              This is the body we dress. The clearer the shot, the better the look previews.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <Reveal className="lg:col-span-7" delay={80}>
              <UploadDropzone photo={photo} onPhoto={setPhoto} onClear={() => setPhoto(null)} />
            </Reveal>

            <Reveal className="lg:col-span-5 flex flex-col gap-4" delay={180}>
              <div className="rounded-lg border border-background-200 bg-background-100 p-5 md:p-6">
                <h2 className="font-heading font-semibold text-base text-foreground-950">
                  Photo tips
                </h2>
                <ul className="mt-4 space-y-3">
                  {tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-3 text-sm text-foreground-700">
                      <i className="ri-check-line text-primary-600 mt-0.5"></i>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-background-200 bg-background-50 p-5 md:p-6">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center shrink-0">
                    <i className="ri-sparkling-line text-lg"></i>
                  </span>
                  <div>
                    <h3 className="font-heading font-semibold text-sm text-foreground-950">
                      No photo handy?
                    </h3>
                    <p className="mt-1 text-sm text-foreground-600">
                      Load a sample model and try the fitting room right away.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPhoto(sampleModelFor(gender, age))}
                      className="mt-3 inline-flex items-center gap-2 h-10 px-4 rounded-md border border-foreground-950 text-foreground-950 text-sm font-semibold hover:bg-foreground-950 hover:text-background-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-user-shared-line"></i>
                      Use a sample model
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                <Link
                  to="/fitting-room/setup"
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md border border-background-300 text-foreground-800 text-sm font-semibold hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-arrow-left-line"></i>
                  Back
                </Link>
                <button
                  type="button"
                  disabled={!photo}
                  onClick={() => navigate("/fitting-room/studio")}
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-md bg-primary-500 text-foreground-950 font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="ri-magic-line text-lg"></i>
                  Enter fitting room
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </main>
    </div>
  );
}