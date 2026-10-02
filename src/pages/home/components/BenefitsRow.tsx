import Reveal from "@/components/base/Reveal";

const benefits = [
  {
    icon: "ri-truck-line",
    title: "Free shipping over $75",
    text: "Carbon-neutral delivery to 60+ countries, tracked door to door.",
  },
  {
    icon: "ri-magic-line",
    title: "AI style on demand",
    text: "Describe what you want and get a curated edit in seconds.",
  },
  {
    icon: "ri-camera-lens-line",
    title: "Try before you buy",
    text: "Preview any piece on your own photo before it ships.",
  },
  {
    icon: "ri-refresh-line",
    title: "30-day easy returns",
    text: "Changed your mind? Send it back, no questions, no drama.",
  },
];

export default function BenefitsRow() {
  return (
    <section className="relative w-full py-14 md:py-20 bg-background-50">
      <div className="w-full px-4 md:px-6 lg:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {benefits.map((benefit, i) => (
            <Reveal key={benefit.title} delay={i * 80}>
              <div className="h-full rounded-2xl bg-background-100 border border-background-200 p-6 flex flex-col">
                <span className="w-12 h-12 rounded-full bg-secondary-100 text-secondary-800 flex items-center justify-center mb-5">
                  <i className={`${benefit.icon} text-2xl`}></i>
                </span>
                <h3 className="font-heading font-bold text-lg text-foreground-950 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-foreground-600 leading-relaxed">{benefit.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}