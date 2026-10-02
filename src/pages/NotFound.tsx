import { Link, useLocation } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen text-center px-4 bg-background-50 text-foreground-950 overflow-hidden">
      {/* Decorative background number */}
      <h1 className="absolute text-[14rem] sm:text-[20rem] font-heading font-black text-background-200/50 select-none pointer-events-none z-0">
        404
      </h1>

      <div className="relative z-10 max-w-md mx-auto">
        <span className="inline-flex items-center gap-2 font-label text-xs uppercase tracking-[0.22em] text-secondary-700 mb-4">
          <i className="ri-error-warning-line text-primary-500"></i> Page Not Found
        </span>
        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-foreground-950 tracking-tight">
          You&apos;ve stepped out of bounds.
        </h2>
        <p className="mt-3 text-sm text-foreground-600 font-mono bg-background-100 py-1.5 px-3 rounded-lg inline-block border border-background-200">
          {location.pathname}
        </p>
        <p className="mt-4 text-base text-foreground-600 leading-relaxed">
          The collection, look, or page you were looking for doesn&apos;t exist or has moved into the archives.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-foreground-950 text-background-50 hover:bg-foreground-800 font-heading font-medium text-sm transition-colors"
          >
            <i className="ri-home-5-line text-base"></i> Return to Store
          </Link>
          <Link
            to="/fitting-room"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-background-200 hover:bg-background-100 font-heading font-medium text-sm text-foreground-800 transition-colors"
          >
            <i className="ri-magic-line text-base text-primary-600"></i> Go to Fitting Room
          </Link>
        </div>
      </div>
    </div>
  );
}