import { useRef, useState, type FormEvent } from "react";
import Reveal from "@/components/base/Reveal";

const SUBMIT_ADDR = "https://readdy.ai/api/form/dav1f66oc082o2i1jt20";

interface FormApiResponse {
  code?: string;
  message?: string;
  meta?: { message?: string; detail?: string };
}

export default function Newsletter() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot check
    const honey = String(formData.get("company_alt") ?? "").trim();
    if (honey) {
      setStatus("success");
      return;
    }

    const payload = new URLSearchParams();
    formData.forEach((value, key) => {
      if (key === "company_alt") return;
      if (typeof value === "string" && value.trim() !== "") {
        payload.append(key, value);
      }
    });

    setStatus("submitting");
    setFormError("");

    try {
      const response = await fetch(SUBMIT_ADDR, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString(),
      });
      const responseText = await response.text();

      let parsed: FormApiResponse | null = null;
      try {
        parsed = JSON.parse(responseText) as FormApiResponse;
      } catch {
        parsed = null;
      }

      const serverMsg =
        parsed?.meta?.message || parsed?.message || parsed?.meta?.detail || responseText || "";
      const succeeded = response.ok && parsed?.code === "OK";

      if (!succeeded || /spam/i.test(serverMsg)) {
        setStatus("error");
        setFormError(serverMsg || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setFormError("Network issue. Please check your connection and try again.");
    }
  };

  return (
    <section className="relative w-full py-16 md:py-24 bg-background-50">
      <div className="w-full px-4 md:px-6 lg:px-10">
        <Reveal>
          <div className="relative w-full rounded-3xl bg-primary-500 overflow-hidden px-6 py-12 md:px-16 md:py-16">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-foreground-950/10"></div>
            <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-accent-500/25"></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-6">
                <span className="inline-flex items-center gap-2 font-label text-xs uppercase tracking-[0.22em] text-foreground-950/70 mb-4">
                  <i className="ri-mail-send-line"></i> The FITSY list
                </span>
                <h2 className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl leading-[0.95] tracking-tight text-foreground-950">
                  Get first dibs
                  <br />
                  on every drop.
                </h2>
                <p className="mt-4 text-base md:text-lg text-foreground-950/75 max-w-md leading-relaxed">
                  Early access, member-only prices and the occasional 20% code. No spam, just heat.
                </p>
              </div>

              <div className="lg:col-span-6">
                <form
                  ref={formRef}
                  id="fitsy-newsletter-form"
                  data-readdy-form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="you@email.com"
                    className="flex-1 h-14 px-5 rounded-full bg-background-50 text-foreground-950 text-base placeholder:text-foreground-400 border border-transparent focus:outline-none focus:border-foreground-950"
                  />
                  <input
                    type="text"
                    name="company_alt"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    readOnly
                    className="field-guard"
                  />
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-foreground-950 text-background-50 font-heading font-bold text-base hover:bg-foreground-800 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-70"
                  >
                    {status === "submitting" ? "Joining…" : "Join the list"}
                    <i className="ri-arrow-right-line text-lg"></i>
                  </button>
                </form>

                {status === "success" && (
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground-950">
                    <i className="ri-checkbox-circle-fill text-lg"></i>
                    You&apos;re on the list. Watch your inbox for the next drop.
                  </p>
                )}
                {status === "error" && (
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground-950">
                    <i className="ri-error-warning-fill text-lg"></i>
                    {formError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}