import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} handles personal information submitted through the quote request form.`,
  alternates: { canonical: "/privacy" },
};

// Privacy Policy (OR-06, SEC-07). TODO(client): have the business owner review
// this text before launch.
export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Privacy Policy" }]}
        eyebrow="Your privacy"
        title="Privacy Policy"
        intro={<p>How we collect, use, and protect the personal information you send us.</p>}
      />

      <article className="max-w-3xl space-y-8 rounded-xl bg-surface-container-lowest p-6 text-body-md text-on-surface shadow-sm sm:p-10">
        <section className="space-y-2">
          <h2 className="text-headline-md text-primary">What we collect</h2>
          <p>
            When you submit the Request a Free Quote form, we collect your full name, contact number,
            email address, the type of service you need, the project location, your project
            description, and any photos you choose to attach.
          </p>
          <p>
            The website has no customer accounts and does not use the form information for
            advertising.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-headline-md text-primary">Why we collect it</h2>
          <p>
            We use this information only to review your project, prepare a quote, and contact you
            about it.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-headline-md text-primary">How it is handled</h2>
          <p>
            Your submission and photos are sent to us by email through our email delivery provider,
            Resend. They are <strong>not stored</strong> on this website, in its database, or in its
            file storage. The website is served over a secure (HTTPS) connection.
          </p>
          <p>
            We handle personal information in line with Canada&apos;s Personal Information
            Protection and Electronic Documents Act (PIPEDA).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-headline-md text-primary">Contact us about your information</h2>
          <p>
            To ask about, correct, or delete information you have sent us, contact us at{" "}
            <a href={`mailto:${site.email}`} className="font-semibold text-secondary underline">
              {site.email}
            </a>{" "}
            or call{" "}
            <a href={site.phone.href} className="font-semibold text-secondary underline">
              {site.phone.display}
            </a>
            .
          </p>
        </section>
      </article>
    </>
  );
}
