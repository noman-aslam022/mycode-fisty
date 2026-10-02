import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGoogleUser: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  verifyAdminPasscode: (code: string) => boolean;
  logoutAdmin: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isGoogleUser: false,
  isAdmin: false,
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  verifyAdminPasscode: () => false,
  logoutAdmin: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminUnlocked, setAdminUnlocked] = useState<boolean>(() => {
    return typeof window !== "undefined" && sessionStorage.getItem("vestra_admin_auth") === "true";
  });

  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Detect if current logged-in user is authenticated via Google
  const isGoogleUser = Boolean(
    user?.app_metadata?.provider === "google" ||
    (Array.isArray(user?.app_metadata?.providers) && user.app_metadata.providers.includes("google")) ||
    user?.identities?.some((id) => id.provider === "google") ||
    (typeof user?.user_metadata?.iss === "string" && user.user_metadata.iss.includes("accounts.google.com"))
  );

  // STRICT RULE: Google authenticated users never have access to the admin panel.
  // Dedicated studio admin credentials or passkey must be provided.
  const isAdmin = !isGoogleUser && adminUnlocked;

  const verifyAdminPasscode = (code: string): boolean => {
    const trimmed = code.trim();
    // Valid administrative passkeys:
    const validKeys = ["vestra-admin", "admin123", "vestra2026", "admin"];
    if (validKeys.includes(trimmed.toLowerCase())) {
      sessionStorage.setItem("vestra_admin_auth", "true");
      setAdminUnlocked(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    sessionStorage.removeItem("vestra_admin_auth");
    setAdminUnlocked(false);
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      return { error };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Google Sign-In failed") };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      logoutAdmin();
      return { error };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Sign-Out failed") };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isGoogleUser,
        isAdmin,
        signInWithGoogle,
        signOut,
        verifyAdminPasscode,
        logoutAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
