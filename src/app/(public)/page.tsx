import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ClipboardList, House, MapPin, Phone } from "lucide-react";
import { ProjectCard } from "@/components/project-card";
import { SectionHeading } from "@/components/page-header";
import { QuoteBanner, QuoteButton } from "@/components/quote-cta";
import { ServiceIcon } from "@/components/service-icon";
import { quoteHrefForService, site } from "@/config/site";
import { getPublishedProjects, getVisibleServices } from "@/lib/data";

// Pre-rendered and refreshed at most every 60 seconds (CP-04, SC-04, PG-08).
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: `${site.name} | Roofing & Renovations in Winnipeg, MB` },
  description: `Residential roof repair, roof replacement, gutters, chimney removal, and renovations in ${site.serviceArea}. Request a free quote online.`,
  alternates: { canonical: "/" },
};

const pillars = [
  { icon: House, label: "Residential homes only" },
  { icon: ClipboardList, label: "Free quotes, no obligation" },
  { icon: MapPin, label: `${site.city} & surrounding areas` },
];

export default async function HomePage() {
  const [services, projects] = await Promise.all([getVisibleServices(), getPublishedProjects()]);
  const featuredServices = services.slice(0, 3); // CP-01
  const recentProjects = projects.slice(0, 6); // CP-01

  return (
    <>
      {/* Hero */}
      <section className="relative mb-14 overflow-hidden rounded-xl bg-primary-container text-surface shadow-xl">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full text-on-primary-container opacity-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <polygon fill="currentColor" points="0,0 100,0 70,100 0,100" />
        </svg>
        <div className="relative grid grid-cols-1 items-center gap-10 px-6 py-10 md:py-16 lg:grid-cols-12 lg:px-12">
          <div className="space-y-6 lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-label-sm text-secondary-fixed uppercase backdrop-blur">
              <BadgeCheck className="size-4" aria-hidden />
              Residential roofing in {site.city}, {site.region}
            </span>
            <h1 className="text-headline-display text-surface">
              Quality Roofing &amp; Renovations for Winnipeg Homes
            </h1>
            <p className="max-w-2xl text-body-lg text-primary-fixed-dim">
              Roof repairs, roof replacements, new roof installations, gutters, chimney removal, and
              renovations for homeowners in {site.serviceArea}.
            </p>
            <ul className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
              {pillars.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 rounded-lg bg-white/5 p-3">
                  <Icon className="size-5 shrink-0 text-secondary-container" aria-hidden />
                  <span className="text-label-md text-surface">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quote call-to-action card (replaces the mini form in the Stitch design) */}
          <div className="rounded-xl bg-surface-container-lowest p-6 text-on-surface shadow-2xl sm:p-8 lg:col-span-5">
            <span className="inline-block rounded bg-secondary-fixed px-2.5 py-0.5 text-label-sm text-on-secondary-fixed uppercase">
              Free estimate
            </span>
            <h2 className="mt-3 text-headline-lg text-primary">Get a Free Quote</h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Tell us about your project and attach a few photos. We&apos;ll review it and get back to
              you by email or phone.
            </p>
            <QuoteButton className="mt-6 w-full" />
            <a
              href={site.phone.href}
              className="touch-target mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-low px-6 text-label-lg text-primary transition hover:bg-surface-container"
            >
              <Phone className="size-5 text-secondary" aria-hidden />
              Or call {site.phone.display}
            </a>
          </div>
        </div>
      </section>

      {/* Featured services (hidden when there are none, SRS 3.2.1.5) */}
      {featuredServices.length > 0 && (
        <section className="mb-16" aria-labelledby="services-heading">
          <SectionHeading eyebrow="What we do" title="Our Services">
            Roofing and renovation services for homes in {site.serviceArea}.
          </SectionHeading>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((service) => (
              <article
                key={service.id}
                className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <span className="mb-5 flex size-12 items-center justify-center rounded bg-primary-container text-surface">
                    <ServiceIcon name={service.name} className="size-6" />
                  </span>
                  <h3 className="mb-2 text-headline-md text-primary">{service.name}</h3>
                  <p className="mb-6 text-body-md text-on-surface-variant">{service.short_description}</p>
                </div>
                <Link
                  href={quoteHrefForService(service.name)}
                  className="touch-target inline-flex w-full items-center justify-between rounded bg-surface-container-low px-3 text-label-md text-primary transition hover:bg-primary hover:text-surface"
                >
                  Request a quote for {service.name.toLowerCase()}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/services" className="touch-target inline-flex items-center gap-1.5 text-label-lg text-secondary hover:underline">
              See all services
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      )}

      {/* Recent projects (hidden when there are none, SRS 3.2.1.5) */}
      {recentProjects.length > 0 && (
        <section className="mb-16" aria-labelledby="projects-heading">
          <SectionHeading eyebrow="Recent work" title="Recently Completed Projects">
            A look at some of the homes we&apos;ve worked on.
          </SectionHeading>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/portfolio" className="touch-target inline-flex items-center gap-1.5 text-label-lg text-secondary hover:underline">
              View the full portfolio
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      )}

      {/* Service area */}
      <section className="rounded-xl bg-surface-container-low p-6 sm:p-10">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <span className="text-label-sm text-secondary uppercase">Service area</span>
            <h2 className="text-headline-lg text-primary">Where We Work</h2>
            <p className="text-body-md text-on-surface-variant">
              We work on residential properties in {site.serviceArea}. Not sure if we cover your
              location? Call or email us and we&apos;ll let you know.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/about" className="touch-target inline-flex items-center gap-1.5 text-label-lg text-secondary hover:underline">
                About us <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/faq" className="touch-target inline-flex items-center gap-1.5 text-label-lg text-secondary hover:underline">
                Common questions <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg bg-surface-container-lowest p-6 shadow-sm">
            <MapPin className="size-10 shrink-0 text-secondary" aria-hidden />
            <div>
              <p className="text-headline-sm text-primary">{site.serviceArea}</p>
              <p className="text-body-md text-on-surface-variant">{site.region}, Canada</p>
            </div>
          </div>
        </div>
      </section>

      <QuoteBanner
        title="Planning a roofing or renovation project?"
        text="Send us the details and a few photos, and we'll follow up with a free quote."
      />
    </>
  );
}
