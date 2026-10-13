import type { Metadata } from "next";
import { Construction, Phone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { QuoteBanner } from "@/components/quote-cta";
import { site } from "@/config/site";
import { getPublishedProjects } from "@/lib/data";
import { PortfolioGallery } from "./portfolio-gallery";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Our Work: Roofing Projects in Winnipeg",
  description: `Photos of completed residential roofing and renovation projects in ${site.serviceArea}.`,
  alternates: { canonical: "/portfolio" },
};

export default async function PortfolioPage() {
  const projects = await getPublishedProjects();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Portfolio" }]}
        eyebrow="Completed projects"
        title="Our Work"
        intro={<p>Recently completed residential roofing and renovation projects in {site.serviceArea}.</p>}
      />

      {projects.length === 0 ? (
        // SRS 3.2.3.5
        <section className="rounded-lg bg-surface-container-low px-6 py-16 text-center shadow-sm">
          <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-surface-container-highest text-primary-container">
            <Construction className="size-8" aria-hidden />
          </span>
          <h2 className="mb-2 text-headline-md text-primary">New projects coming soon.</h2>
          <p className="mx-auto mb-6 max-w-md text-body-md text-on-surface-variant">
            We&apos;re adding photos of our recent work. In the meantime, feel free to give us a call.
          </p>
          <a
            href={site.phone.href}
            className="touch-target inline-flex items-center gap-2 rounded bg-primary-container px-5 text-label-lg text-on-primary"
          >
            <Phone className="size-4" aria-hidden />
            {site.phone.display}
          </a>
        </section>
      ) : (
        <PortfolioGallery projects={projects} />
      )}

      <QuoteBanner
        title="Inspired by one of our projects?"
        text="Tell us about your home and we'll follow up with a free quote."
      />
    </>
  );
}
