import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Reveal from "@/components/base/Reveal";
import { useAuth } from "@/lib/auth";

interface AuthPageProps {
  initialMode?: "login" | "register";
}

export default function AuthPage({ initialMode }: AuthPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  // Determine starting tab based on prop or pathname
  const isRegisterPath = initialMode === "register" || location.pathname === "/register";
  const [mode, setMode] = useState<"login" | "register">(isRegisterPath ? "register" : "login");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (mode === "register") {
      if (!name) {
        setErrorMessage("Please enter your name.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }
      if (!agreeTerms) {
        setErrorMessage("Please agree to the Terms of Service.");
        return;
      }
    }

    setLoading(true);

    // Mock authentication flow
    setTimeout(() => {
      setLoading(false);
      setToastMessage(
        mode === "login"
          ? `Welcome back, ${email.split("@")[0]}!`
          : `Account created! Welcome to VESTRA, ${name}!`
      );

      // Auto redirect to home after 1.5s
      setTimeout(() => {
        navigate("/");
      }, 1500);
    }, 800);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMessage(error.message || "Failed to initialize Google Sign-In.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background-50 text-foreground-950 flex flex-col justify-between relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full px-6 md:px-12 py-6 flex items-center justify-between z-10">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-foreground-950 font-heading font-extrabold text-lg transition-transform duration-300 group-hover:rotate-12">
            F
          </span>
          <span className="font-heading font-extrabold text-2xl tracking-tight text-foreground-950">
            FITSY
          </span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground-700 hover:text-foreground-950 transition-colors"
        >
          <i className="ri-arrow-left-line text-lg" />
          <span>Back to store</span>
        </Link>
      </header>

      {/* Auth Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-md">
          <Reveal>
            <div className="bg-background-50/90 backdrop-blur-xl border border-background-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-foreground-950/5">
              {/* Header Title */}
              <div className="text-center mb-6">
                <span className="inline-flex items-center gap-1.5 font-label text-xs uppercase tracking-[0.2em] text-secondary-700 mb-2">
                  <i className="ri-sparkling-2-fill text-primary-500 text-xs" />
                  VESTRA Studio
                </span>
                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-foreground-950 tracking-tight">
                  {mode === "login" ? "Welcome back" : "Create an account"}
                </h1>
                <p className="text-sm text-foreground-600 mt-1">
                  {mode === "login"
                    ? "Sign in to access your fitting room and orders"
                    : "Join the next generation of studio fashion"}
                </p>
              </div>

              {/* Tabs Switcher */}
              <div className="grid grid-cols-2 p-1 bg-background-100 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMessage(null);
                  }}
                  className={`py-2 text-sm font-medium rounded-xl transition-all ${
                    mode === "login"
                      ? "bg-background-50 text-foreground-950 shadow-sm"
                      : "text-foreground-600 hover:text-foreground-950"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setErrorMessage(null);
                  }}
                  className={`py-2 text-sm font-medium rounded-xl transition-all ${
                    mode === "register"
                      ? "bg-background-50 text-foreground-950 shadow-sm"
                      : "text-foreground-600 hover:text-foreground-950"
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-accent-500/10 border border-accent-500/30 text-accent-500 text-xs flex items-center gap-2">
                  <i className="ri-error-warning-line text-base shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Toast */}
              {toastMessage && (
                <div className="mb-4 p-3 rounded-xl bg-primary-500/20 border border-primary-500/40 text-foreground-950 text-xs flex items-center gap-2 animate-bounce">
                  <i className="ri-checkbox-circle-line text-primary-600 text-base shrink-0" />
                  <span className="font-medium">{toastMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <div>
                    <label className="block text-xs font-label uppercase tracking-wider text-foreground-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <i className="ri-user-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-base" />
                      <input
                        type="text"
                        placeholder="Alex Rivera"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:border-foreground-950 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-label uppercase tracking-wider text-foreground-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <i className="ri-mail-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-base" />
                    <input
                      type="email"
                      placeholder="alex@vestra.studio"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:border-foreground-950 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-label uppercase tracking-wider text-foreground-700">
                      Password
                    </label>
                    {mode === "login" && (
                      <a
                        href="#forgot"
                        onClick={(e) => {
                          e.preventDefault();
                          alert("Password reset is in mock mode for now.");
                        }}
                        className="text-xs text-foreground-600 hover:text-foreground-950 transition-colors"
                      >
                        Forgot password?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <i className="ri-lock-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-base" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:border-foreground-950 transition-colors"
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-950 transition-colors"
                    >
                      <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} />
                    </button>
                  </div>
                </div>

                {mode === "register" && (
                  <div>
                    <label className="block text-xs font-label uppercase tracking-wider text-foreground-700 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <i className="ri-lock-check-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-base" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:border-foreground-950 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Checkboxes */}
                {mode === "login" ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-background-200 text-foreground-950 focus:ring-primary-500 accent-foreground-950"
                    />
                    <label htmlFor="rememberMe" className="text-xs text-foreground-700 cursor-pointer select-none">
                      Remember me for 30 days
                    </label>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 pt-1">
                    <input
                      id="agreeTerms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-background-200 text-foreground-950 focus:ring-primary-500 accent-foreground-950"
                    />
                    <label htmlFor="agreeTerms" className="text-xs text-foreground-700 cursor-pointer select-none leading-relaxed">
                      I agree to the{" "}
                      <span className="text-foreground-950 underline underline-offset-2">Terms of Service</span> and{" "}
                      <span className="text-foreground-950 underline underline-offset-2">Privacy Policy</span>.
                    </label>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-4 rounded-xl bg-foreground-950 text-background-50 hover:bg-foreground-800 font-heading font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <i className="ri-loader-4-line animate-spin text-lg" />
                  ) : mode === "login" ? (
                    <>
                      <span>Sign In</span>
                      <i className="ri-arrow-right-line" />
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <i className="ri-arrow-right-line" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-background-200" />
                </div>
                <span className="relative px-3 bg-background-50 text-xs text-foreground-500 uppercase tracking-widest font-label">
                  Or continue with
                </span>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="h-10 px-4 rounded-xl border border-background-200 hover:bg-background-100 flex items-center justify-center gap-2 text-xs font-medium text-foreground-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <i className="ri-google-fill text-base text-accent-500" />
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert("Apple Sign-In is in mock mode for now.")}
                  className="h-10 px-4 rounded-xl border border-background-200 hover:bg-background-100 flex items-center justify-center gap-2 text-xs font-medium text-foreground-800 transition-colors"
                >
                  <i className="ri-apple-fill text-base text-foreground-950" />
                  <span>Apple</span>
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="w-full py-4 text-center text-xs text-foreground-500 z-10">
        <p>© {new Date().getFullYear()} VESTRA Studio. Frontend mock authorization mode.</p>
      </footer>
    </div>
  );
}
