import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AgeGroup, Gender } from "@/pages/fitting-room/types";

interface FittingRoomState {
  gender: Gender | null;
  age: AgeGroup | null;
  photo: string | null;
  setGender: (gender: Gender) => void;
  setAge: (age: AgeGroup) => void;
  setPhoto: (photo: string | null) => void;
  reset: () => void;
}

const STORAGE_KEY = "fitsy:fitting-room";

const FittingRoomContext = createContext<FittingRoomState | null>(null);

interface Persisted {
  gender: Gender | null;
  age: AgeGroup | null;
  photo: string | null;
}

const readPersisted = (): Persisted => {
  const fallback: Persisted = { gender: null, age: null, photo: null };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      gender: parsed.gender ?? null,
      age: parsed.age ?? null,
      photo: parsed.photo ?? null,
    };
  } catch {
    return fallback;
  }
};

export function FittingRoomProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(readPersisted, []);
  const [gender, setGender] = useState<Gender | null>(initial.gender);
  const [age, setAge] = useState<AgeGroup | null>(initial.age);
  const [photo, setPhoto] = useState<string | null>(initial.photo);

  /* Keep the flow alive across reloads so the studio never bounces to a blank page. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ gender, age, photo }));
    } catch {
      /* Storage can be full or blocked — the flow still works in memory. */
    }
  }, [gender, age, photo]);

  const reset = useCallback(() => {
    setGender(null);
    setAge(null);
    setPhoto(null);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const value = useMemo(
    () => ({ gender, age, photo, setGender, setAge, setPhoto, reset }),
    [gender, age, photo, reset]
  );

  return <FittingRoomContext.Provider value={value}>{children}</FittingRoomContext.Provider>;
}

export function useFittingRoom(): FittingRoomState {
  const ctx = useContext(FittingRoomContext);
  if (!ctx) {
    throw new Error("useFittingRoom must be used inside a FittingRoomProvider");
  }
  return ctx;
}