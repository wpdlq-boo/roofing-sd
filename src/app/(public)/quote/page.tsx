import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { quoteServiceOptions, site } from "@/config/site";
import { QuoteForm } from "./quote-form";

export const metadata: Metadata = {
  title: "Request a Free Quote",
  description: `Request a free roofing or renovation quote from ${site.name}. Serving ${site.serviceArea}.`,
  alternates: { canonical: "/quote" },
};

const steps = [
  { title: "Send your request", text: "Fill in the form and attach photos if you have them." },
  { title: "We review it", text: "We look over your project details and photos." },
  { title: "We get back to you", text: "We reply by email or phone to talk about your quote." },
];

export default async function QuotePage({ searchParams }: PageProps<"/quote">) {
  const { service } = await searchParams;
  // Preselect the option passed from a service's button (QR-02).
  const initialService = quoteServiceOptions.some((o) => o.value === service) ? (service as string) : "";

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Request a Free Quote" }]}
        eyebrow="Free estimate"
        title="Request a Free Quote"
        intro={<p>Tell us about your project and we&apos;ll get back to you. There&apos;s no cost or obligation.</p>}
      />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <QuoteForm initialService={initialService} />
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <div className="space-y-5 rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
            <h2 className="text-headline-sm text-primary">What happens next?</h2>
            <ol className="space-y-5">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-label-lg text-primary">{step.title}</p>
                    <p className="text-sm text-on-surface-variant">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-3 rounded-2xl bg-primary p-6 text-center text-on-primary shadow-sm">
            <h2 className="text-headline-sm">Prefer to talk?</h2>
            <p className="text-sm text-primary-fixed-dim">Call us with any questions about your project.</p>
            <a
              href={site.phone.href}
              className="touch-target flex w-full items-center justify-center gap-2 rounded-lg bg-secondary-container py-3 text-label-lg text-on-secondary-container shadow-sm hover:bg-secondary-fixed"
            >
              <Phone className="size-5" aria-hidden />
              {site.phone.display}
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
