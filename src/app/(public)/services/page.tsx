import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleCheck, ClipboardList, House, Info, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { QuoteBanner, QuoteButton } from "@/components/quote-cta";
import { ServiceIcon } from "@/components/service-icon";
import { PhotoPlaceholder, SiteImage } from "@/components/site-image";
import { quoteHrefForService, site } from "@/config/site";
import { getVisibleServices } from "@/lib/data";
import { buckets, publicImageUrl } from "@/lib/supabase/env";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Roofing & Renovation Services in Winnipeg",
  description: `Roof installation, roof repair, roof replacement, gutter cleaning, gutter guards, chimney removal, and renovations in ${site.serviceArea}.`,
  alternates: { canonical: "/services" },
};

const highlights = [
  { icon: House, title: "Residential only", text: "We focus on homes and garages." },
  { icon: ClipboardList, title: "Free quotes", text: "Tell us about the job at no cost." },
  { icon: MapPin, title: "Local", text: site.serviceArea },
];

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function ServicesPage() {
  const services = await getVisibleServices();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Services" }]}
        eyebrow="Residential services"
        title="Our Services"
        intro={<p>Roofing, gutter, chimney, and renovation work for homes in {site.serviceArea}.</p>}
        aside={
          <ul className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex flex-1 items-center gap-3 rounded-lg bg-surface-container-low p-3 shadow-sm">
                <span className="flex size-10 shrink-0 items-center justify-center rounded bg-primary-container text-on-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-label-lg text-on-surface">{title}</span>
                  <span className="block text-sm text-on-surface-variant">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        }
      />

      {services.length === 0 ? (
        // SRS 3.2.2.5
        <div className="flex items-start gap-3 rounded-xl bg-primary-container p-6 text-on-primary shadow-md">
          <Info className="mt-0.5 size-6 shrink-0 text-secondary-container" aria-hidden />
          <p className="text-body-md">
            Our services list is being updated. Please call us at{" "}
            <a href={site.phone.href} className="font-semibold text-secondary-fixed underline">
              {site.phone.display}
            </a>{" "}
            to ask about our services.
          </p>
        </div>
      ) : (
        <>
          {/* Jump links */}
          <nav
            aria-label="Jump to a service"
            className="sticky top-20 z-30 -mx-4 mb-8 bg-surface/95 px-4 py-3 shadow-sm backdrop-blur sm:mx-0 sm:rounded-lg"
          >
            <ul className="flex gap-2 overflow-x-auto">
              {services.map((service) => (
                <li key={service.id}>
                  <a
                    href={`#${slug(service.name)}`}
                    className="touch-target inline-flex items-center rounded-full bg-surface-container-lowest px-4 text-label-md whitespace-nowrap text-on-surface shadow-sm hover:bg-surface-container-highest"
                  >
                    {service.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-10">
            {services.map((service, index) => (
              <article
                key={service.id}
                id={slug(service.name)}
                className="grid scroll-mt-40 grid-cols-1 overflow-hidden rounded-xl bg-surface-container-lowest shadow-md lg:grid-cols-12"
              >
                <div
                  className={`relative min-h-[260px] lg:col-span-5 ${index % 2 === 1 ? "lg:order-2" : ""}`}
                >
                  {service.image_path ? (
                    <SiteImage
                      src={publicImageUrl(buckets.serviceImages, service.image_path)}
                      alt={service.name}
                      fill
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <PhotoPlaceholder className="absolute inset-0" />
                  )}
                </div>
                <div className="flex flex-col justify-between gap-6 p-6 sm:p-8 lg:col-span-7 lg:p-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded bg-secondary-fixed text-on-secondary-fixed">
                        <ServiceIcon name={service.name} className="size-6" />
                      </span>
                      <h2 className="text-headline-xl text-primary">{service.name}</h2>
                    </div>
                    <p className="flex items-start gap-2 text-body-lg text-on-surface">
                      <CircleCheck className="mt-1 size-5 shrink-0 text-secondary" aria-hidden />
                      {service.short_description}
                    </p>
                    <p className="text-body-md whitespace-pre-line text-on-surface-variant">
                      {service.full_description}
                    </p>
                  </div>
                  <div className="flex flex-col items-stretch gap-4 rounded-lg bg-surface-container-low p-4 sm:flex-row sm:items-center">
                    <QuoteButton href={quoteHrefForService(service.name)}>Request a Quote</QuoteButton>
                    <a
                      href={site.phone.href}
                      className="touch-target inline-flex items-center justify-center gap-1.5 text-label-md text-primary hover:text-secondary sm:ml-auto"
                    >
                      <Phone className="size-4" aria-hidden />
                      Questions? Call {site.phone.display}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <QuoteBanner
        title="Not sure which service you need?"
        text="Describe the problem in a quote request and attach photos. We'll take a look and follow up."
      />
      <p className="mt-6 text-center text-body-md text-on-surface-variant">
        Have a general question?{" "}
        <Link href="/faq" className="inline-flex items-center gap-1 font-semibold text-secondary hover:underline">
          Read our FAQ <ArrowRight className="size-4" aria-hidden />
        </Link>
      </p>
    </>
  );
}
