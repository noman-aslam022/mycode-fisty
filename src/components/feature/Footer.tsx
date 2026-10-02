import { Link } from "react-router-dom";

const columns = [
  {
    title: "Shop",
    links: ["New Arrivals", "Streetwear", "Outerwear", "Accessories", "Footwear", "Sale"],
  },
  {
    title: "Experience",
    links: ["AI Stylist", "Virtual Try-On", "Gift Finder", "The Drop", "Wishlist"],
  },
  {
    title: "Help",
    links: ["Shipping & Returns", "Size Guide", "Track Order", "Contact", "FAQ"],
  },
  {
    title: "Company",
    links: ["About FITSY", "Sustainability", "Careers", "Press", "Partners"],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#171E07] text-background-100">
      <div className="w-full px-4 md:px-6 lg:px-10 pt-16 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-foreground-950 font-heading font-extrabold text-xl">
                F
              </span>
              <span className="font-heading font-extrabold text-3xl text-background-50">FITSY</span>
            </div>
            <p className="text-sm text-background-200/80 max-w-sm leading-relaxed mb-6">
              The next-gen fashion store where AI does the styling and you just show up looking unreal.
              Curated drops, built for the internet.
            </p>
            <div className="flex items-center gap-3">
              {["ri-instagram-line", "ri-tiktok-line", "ri-pinterest-line", "ri-youtube-line"].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  aria-label="Social link"
                  className="w-10 h-10 rounded-full bg-background-50/10 hover:bg-primary-500 hover:text-foreground-950 flex items-center justify-center text-background-50 transition-colors cursor-pointer"
                >
                  <i className={`${icon} text-lg`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="font-label text-xs uppercase tracking-[0.18em] text-primary-400 mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link
                        to="/"
                        className="text-sm text-background-200/80 hover:text-background-50 transition-colors"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Payment / bottom bar */}
        <div className="mt-14 pt-6 border-t border-background-50/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background-200/60">
            © {new Date().getFullYear()} FITSY Studio. All rights reserved. Made for the fit-obsessed.
          </p>
          <div className="flex items-center gap-2 text-background-50/80">
            <i className="ri-visa-line text-2xl"></i>
            <i className="ri-mastercard-line text-2xl"></i>
            <i className="ri-paypal-line text-2xl"></i>
            <i className="ri-apple-fill text-2xl"></i>
          </div>
        </div>
      </div>
    </footer>
  );
}