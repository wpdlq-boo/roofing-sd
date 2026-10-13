import { ExternalLink, Mail, Phone } from "lucide-react";
import { FacebookIcon } from "@/components/facebook-icon";
import { QuoteButton } from "@/components/quote-cta";
import { site } from "@/config/site";

// "Still have questions?" block under the FAQs (FQ-05).
export function StillHaveQuestions() {
  return (
    <section
      aria-labelledby="still-questions"
      className="mt-12 rounded-xl bg-primary-container p-8 text-on-primary shadow-md sm:p-10"
    >
      <h2 id="still-questions" className="text-headline-lg">
        Still have questions?
      </h2>
      <p className="mt-2 max-w-2xl text-body-md text-primary-fixed-dim">
        Call or email us and we&apos;ll be happy to help.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <a href={site.phone.href} className="touch-target flex items-center gap-3 rounded-lg bg-white/10 p-4 hover:bg-white/20">
          <Phone className="size-5 text-secondary-container" aria-hidden />
          <span>
            <span className="block text-label-sm text-primary-fixed-dim uppercase">Phone</span>
            <span className="font-bold">{site.phone.display}</span>
          </span>
        </a>
        <a href={`mailto:${site.email}`} className="touch-target flex items-center gap-3 rounded-lg bg-white/10 p-4 hover:bg-white/20">
          <Mail className="size-5 text-secondary-container" aria-hidden />
          <span className="min-w-0">
            <span className="block text-label-sm text-primary-fixed-dim uppercase">Email</span>
            <span className="block font-bold break-all">{site.email}</span>
          </span>
        </a>
        <a
          href={site.facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="touch-target flex items-center gap-3 rounded-lg bg-white/10 p-4 hover:bg-white/20"
        >
          <FacebookIcon className="size-5 text-secondary-container" />
          <span className="font-bold">Facebook</span>
          <ExternalLink className="ml-auto size-4 text-primary-fixed-dim" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
      <QuoteButton className="mt-6" />
    </section>
  );
}
