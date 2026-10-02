import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/feature/Navbar";
import Reveal from "@/components/feature/Reveal";
import StepBar from "@/pages/fitting-room/components/StepBar";
import GenderPicker from "@/pages/fitting-room/components/GenderPicker";
import AgePicker from "@/pages/fitting-room/components/AgePicker";
import { useFittingRoom } from "@/pages/fitting-room/context";

export default function FittingRoomSetup() {
  const navigate = useNavigate();
  const { gender, age, setGender, setAge } = useFittingRoom();
  const ready = Boolean(gender && age);

  return (
    <div className="min-h-screen w-full bg-background-50 overflow-x-hidden">
      <Navbar />

      <main className="w-full px-4 md:px-8 pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto">
          <StepBar current={1} />

          <div className="mt-10 md:mt-14 text-center max-w-2xl mx-auto animate-fade-up">
            <span className="text-[11px] font-label uppercase tracking-[0.24em] text-secondary-600">
              Step 01 · Profile
            </span>
            <h1 className="mt-3 font-heading font-bold text-3xl md:text-5xl tracking-tight text-foreground-950">
              Who are we styling today?
            </h1>
            <p className="mt-4 text-sm md:text-base text-foreground-600 leading-relaxed">
              Your picks shape the wardrobe we show you in the fitting room, so shirts land
              on shirts and jackets on jackets.
            </p>
          </div>

          <Reveal className="mt-12" delay={80}>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-7 h-7 rounded-full bg-foreground-950 text-background-50 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <h2 className="font-heading font-semibold text-lg text-foreground-950">
                Select a gender
              </h2>
            </div>
            <GenderPicker value={gender} onChange={setGender} />
          </Reveal>

          <Reveal className="mt-12" delay={160}>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-7 h-7 rounded-full bg-foreground-950 text-background-50 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <h2 className="font-heading font-semibold text-lg text-foreground-950">
                Select an age group
              </h2>
            </div>
            <AgePicker value={age} onChange={setAge} />
          </Reveal>

          <div className="mt-12 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <Link
              to="/fitting-room"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md border border-background-300 text-foreground-800 text-sm font-semibold hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-arrow-left-line"></i>
              Back
            </Link>

            <div className="flex items-center gap-4">
              {!ready && (
                <span className="hidden sm:inline text-xs text-foreground-500">
                  Pick a gender and age group to continue
                </span>
              )}
              <button
                type="button"
                disabled={!ready}
                onClick={() => navigate("/fitting-room/upload")}
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-md bg-primary-500 text-foreground-950 font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}