import type { Metadata } from "next";
import { House, MapPin, Target, Wrench } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { QuoteBanner } from "@/components/quote-cta";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${site.name}, a residential roofing and renovation company serving ${site.serviceArea}.`,
  alternates: { canonical: "/about" },
};

// TODO(client): the background and mission text below is placeholder copy.
// Replace it with the wording Ermie supplies (SRS 3.2.1.1, CP-02).
const sections = [
  {
    icon: House,
    title: "Our Background",
    body: `${site.name} is a residential roofing and renovation business based in ${site.city}, ${site.region}. We help homeowners keep their roofs, gutters, and homes in good shape.`,
  },
  {
    icon: Target,
    title: "Our Mission",
    body: "To do honest, careful work on every home, explain the job clearly, and leave each property clean when we finish.",
  },
  {
    icon: Wrench,
    title: "Areas of Expertise",
    body: "Roof installation, roof repair, roof replacement, gutter cleaning, gutter guard installation, chimney removal, and residential renovations.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "About" }]}
        eyebrow="About us"
        title={`About ${site.shortName}`}
        intro={
          <p>
            We&apos;re a residential roofing and renovation company serving {site.serviceArea}.
          </p>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {sections.map(({ icon: Icon, title, body }) => (
          <section key={title} className="rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
            <span className="mb-5 flex size-12 items-center justify-center rounded bg-primary-container text-surface">
              <Icon className="size-6" aria-hidden />
            </span>
            <h2 className="mb-2 text-headline-md text-primary">{title}</h2>
            <p className="text-body-md text-on-surface-variant">{body}</p>
          </section>
        ))}
      </div>

      <section className="mt-6 flex flex-col gap-6 rounded-xl bg-surface-container-low p-6 sm:flex-row sm:items-center sm:p-8">
        <MapPin className="size-10 shrink-0 text-secondary" aria-hidden />
        <div>
          <h2 className="text-headline-md text-primary">Service Area</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            We serve {site.serviceArea}. We work with <strong>residential customers only</strong>;
            commercial work is outside what we offer.
          </p>
        </div>
      </section>

      <QuoteBanner
        title="Let's talk about your home"
        text="Request a free quote online, or call us with any questions."
      />
    </>
  );
}
