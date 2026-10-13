import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleHelp, ClipboardList, ExternalLink, Mail, MapPin, Phone, Send } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { FacebookIcon } from "@/components/facebook-icon";
import { PageHeader } from "@/components/page-header";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Call or email ${site.name} in ${site.city}. Serving ${site.serviceArea}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Contact" }]}
        eyebrow="Get in touch"
        title="Contact Us"
        intro={<p>Have a question? Give us a call or send us an email. We&apos;re happy to help.</p>}
      />

      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Phone (CT-01, CT-02, 3.2.4.5) */}
        <article className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-surface-container text-primary">
                <Phone className="size-5" aria-hidden />
              </span>
              <h2 className="text-headline-md text-primary">Phone</h2>
            </div>
            <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-lg bg-surface-container-low p-4 sm:flex-row sm:items-center">
              <span className="font-mono text-headline-md text-primary select-all">{site.phone.display}</span>
              <CopyButton value={site.phone.display} label="Copy number" />
            </div>
          </div>
          <a
            href={site.phone.href}
            className="touch-target inline-flex items-center justify-center gap-2 self-start rounded-lg bg-primary px-6 text-label-lg text-on-primary shadow-sm hover:bg-tertiary"
          >
            <Phone className="size-5" aria-hidden />
            Tap to call
          </a>
        </article>

        {/* Email (CT-01, CT-03, 3.2.4.5) */}
        <article className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-surface-container text-primary">
                <Mail className="size-5" aria-hidden />
              </span>
              <h2 className="text-headline-md text-primary">Email</h2>
            </div>
            <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-lg bg-surface-container-low p-4 sm:flex-row sm:items-center">
              <span className="min-w-0 font-mono text-headline-sm break-all text-primary select-all">{site.email}</span>
              <CopyButton value={site.email} label="Copy email" />
            </div>
          </div>
          <a
            href={`mailto:${site.email}`}
            className="touch-target inline-flex items-center justify-center gap-2 self-start rounded-lg bg-surface-container px-6 text-label-lg text-primary hover:bg-surface-container-high"
          >
            <Send className="size-5" aria-hidden />
            Send an email
          </a>
        </article>

        {/* Service area */}
        <article className="flex items-center gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
            <MapPin className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-headline-sm text-primary">Service Area</h2>
            <p className="text-body-md text-on-surface-variant">
              {site.serviceArea}, {site.region}. Residential customers only.
            </p>
          </div>
        </article>

        {/* Facebook (CT-01, SW-06) */}
        <article className="flex flex-col justify-between gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
              <FacebookIcon className="size-6" />
            </span>
            <div>
              <h2 className="text-headline-sm text-primary">Facebook</h2>
              <p className="text-body-md text-on-surface-variant">See our latest work and updates.</p>
            </div>
          </div>
          <a
            href={site.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-surface-container-low px-4 text-label-md text-primary hover:bg-surface-container"
          >
            Visit our page
            <ExternalLink className="size-4" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </article>
      </div>

      {/* FAQ and quote links (CT-04) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <article className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-8 shadow-sm">
          <div>
            <span className="mb-6 flex size-12 items-center justify-center rounded-lg bg-surface-container text-primary">
              <CircleHelp className="size-6" aria-hidden />
            </span>
            <h2 className="mb-3 text-headline-md text-primary">Frequently Asked Questions</h2>
            <p className="mb-6 text-body-md text-on-surface-variant">
              Find quick answers about our services, service area, and how quotes work.
            </p>
          </div>
          <Link
            href="/faq"
            className="touch-target inline-flex items-center gap-2 self-start rounded-lg bg-surface-container px-5 text-label-lg text-primary transition hover:bg-primary hover:text-on-primary"
          >
            Read the FAQ <ArrowRight className="size-4" aria-hidden />
          </Link>
        </article>
        <article className="flex flex-col justify-between rounded-xl bg-primary p-8 text-on-primary shadow-sm">
          <div>
            <span className="mb-6 flex size-12 items-center justify-center rounded-lg bg-white/10 text-secondary-container">
              <ClipboardList className="size-6" aria-hidden />
            </span>
            <h2 className="mb-3 text-headline-md">Request a Free Quote</h2>
            <p className="mb-6 text-body-md text-primary-fixed-dim">
              Describe your project and attach photos. We&apos;ll follow up by email or phone.
            </p>
          </div>
          <Link
            href="/quote"
            className="touch-target inline-flex items-center gap-2 self-start rounded-lg bg-secondary-container px-5 text-label-lg text-on-secondary-container hover:bg-secondary-fixed"
          >
            Start your quote <ArrowRight className="size-4" aria-hidden />
          </Link>
        </article>
      </div>
    </>
  );
}
