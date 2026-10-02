import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import Hero from "./components/Hero";
import MarqueeBand from "./components/MarqueeBand";
import AiStylistSection from "./components/AiStylistSection";
import TryOnSection from "./components/TryOnSection";
import FeaturedProducts from "./components/FeaturedProducts";
import CategorySection from "./components/CategorySection";
import BenefitsRow from "./components/BenefitsRow";
import Testimonials from "./components/Testimonials";
import Newsletter from "./components/Newsletter";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-background-50 overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <MarqueeBand
          variant="dark"
          words={["New drop live", "AI styled", "Try before you buy", "Shop the future"]}
        />
        <AiStylistSection />
        <TryOnSection />
        <FeaturedProducts />
        <MarqueeBand
          variant="lime"
          words={["Free shipping $75+", "30-day returns", "60+ countries", "Member prices"]}
        />
        <CategorySection />
        <BenefitsRow />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}