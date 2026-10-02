import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";

const navLinks = [
  { label: "New In", href: "#featured" },
  { label: "Shop", href: "#categories" },
  { label: "AI Stylist", href: "#ai-stylist" },
  { label: "Fitting Room", to: "/fitting-room" },
  { label: "Reviews", href: "#reviews" },
];

export default function Navbar() {
  const { user, signOut, isGoogleUser } = useAuth();
  const [userDropdown, setUserDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const tickerItems = [
    "FREE SHIPPING OVER $75",
    "AI STYLIST IS LIVE",
    "NEW DROPS EVERY FRIDAY",
    "30-DAY EASY RETURNS",
    "TRY BEFORE YOU BUY",
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background-50/90 backdrop-blur-xl border-b border-background-200/70"
          : "bg-transparent"
      }`}
    >
      {/* Announcement ticker */}
      <div className="w-full bg-foreground-950 text-background-50 overflow-hidden">
        <div className="flex w-max animate-marquee-fast py-2">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center" aria-hidden={dup === 1}>
              {tickerItems.map((item) => (
                <span key={`${dup}-${item}`} className="flex items-center">
                  <span className="font-label text-[11px] md:text-xs uppercase tracking-[0.22em] px-6">
                    {item}
                  </span>
                  <i className="ri-sparkling-2-fill text-primary-500 text-xs"></i>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full px-4 md:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <span className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-foreground-950 font-heading font-extrabold text-lg transition-transform duration-300 group-hover:rotate-12">
              F
            </span>
            <span className="font-heading font-extrabold text-2xl tracking-tight text-foreground-950">
              FITSY
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) =>
              link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  className="px-4 py-2 rounded-full text-sm font-medium text-foreground-700 hover:text-foreground-950 hover:bg-background-100 transition-colors duration-200 whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 rounded-full text-sm font-medium text-foreground-700 hover:text-foreground-950 hover:bg-background-100 transition-colors duration-200 whitespace-nowrap"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              type="button"
              aria-label="Search"
              className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full text-foreground-800 hover:bg-background-100 transition-colors cursor-pointer"
            >
              <i className="ri-search-line text-xl"></i>
            </button>
            <button
              type="button"
              aria-label="Wishlist"
              className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full text-foreground-800 hover:bg-background-100 transition-colors cursor-pointer"
            >
              <i className="ri-heart-3-line text-xl"></i>
            </button>
            {user ? (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setUserDropdown((v) => !v)}
                  className="flex items-center gap-2 py-1 px-2 rounded-full border border-background-200 bg-background-50 hover:bg-background-100 transition-colors cursor-pointer"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="User avatar"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-primary-500 text-foreground-950 font-bold text-xs flex items-center justify-center">
                      {(user.user_metadata?.full_name || user.email || "U")[0].toUpperCase()}
                    </span>
                  )}
                  <span className="text-xs font-medium text-foreground-900 max-w-[100px] truncate">
                    {user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0]}
                  </span>
                  <i className="ri-arrow-down-s-line text-foreground-500 text-xs"></i>
                </button>

                {userDropdown && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-background-50 border border-background-200 shadow-xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-background-200 mb-1">
                      <p className="text-xs font-semibold text-foreground-950 truncate">
                        {user.user_metadata?.full_name || "Account"}
                      </p>
                      <p className="text-[11px] text-foreground-500 truncate font-mono">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      to="/fitting-room"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-foreground-800 hover:bg-background-100 transition-colors"
                    >
                      <i className="ri-magic-line text-primary-600 text-sm"></i>
                      <span>My Fitting Room</span>
                    </Link>
                    {!isGoogleUser && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-foreground-800 hover:bg-background-100 transition-colors"
                      >
                        <i className="ri-dashboard-line text-sm"></i>
                        <span>Studio Admin</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        setUserDropdown(false);
                        await signOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-accent-500 hover:bg-accent-500/10 transition-colors text-left cursor-pointer"
                    >
                      <i className="ri-logout-box-r-line text-sm"></i>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                aria-label="Account"
                className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full text-foreground-800 hover:bg-background-100 transition-colors cursor-pointer"
              >
                <i className="ri-user-3-line text-xl"></i>
              </Link>
            )}
            <a
              href="#featured"
              className="relative flex items-center gap-2 h-10 pl-3 pr-4 rounded-full bg-foreground-950 text-background-50 hover:bg-foreground-800 transition-colors cursor-pointer"
              aria-label="Cart"
            >
              <i className="ri-shopping-bag-3-line text-lg"></i>
              <span className="text-sm font-medium whitespace-nowrap">Cart</span>
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-500 text-background-50 text-[11px] font-bold flex items-center justify-center">
                2
              </span>
            </a>
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full text-foreground-950 hover:bg-background-100 transition-colors cursor-pointer"
            >
              <i className={menuOpen ? "ri-close-line text-2xl" : "ri-menu-4-line text-2xl"}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-400 ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        } bg-background-50/95 backdrop-blur-xl border-b border-background-200/70`}
      >
        <nav className="px-4 py-4 flex flex-col gap-1">
          {navLinks.map((link) =>
            link.to ? (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-base font-medium text-foreground-800 hover:bg-background-100 transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-base font-medium text-foreground-800 hover:bg-background-100 transition-colors"
              >
                {link.label}
              </a>
            )
          )}
          <div className="flex items-center gap-4 px-4 pt-3 text-foreground-700">
            <button type="button" aria-label="Search" className="hover:text-foreground-950">
              <i className="ri-search-line text-xl"></i>
            </button>
            <button type="button" aria-label="Wishlist" className="hover:text-foreground-950">
              <i className="ri-heart-3-line text-xl"></i>
            </button>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground-800">
                  {user.email?.split("@")[0]}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    setMenuOpen(false);
                    await signOut();
                  }}
                  className="text-xs text-accent-500 font-medium ml-2 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                aria-label="Account"
                className="hover:text-foreground-950"
              >
                <i className="ri-user-3-line text-xl"></i>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}