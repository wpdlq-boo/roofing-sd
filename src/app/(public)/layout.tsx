import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/config/site";

// Local business structured data (OR-04).
const localBusiness = {
  "@context": "https://schema.org",
  "@type": "RoofingContractor",
  name: site.name,
  url: site.url,
  telephone: site.phone.display,
  email: site.email,
  areaServed: site.serviceArea,
  address: {
    "@type": "PostalAddress",
    addressLocality: site.city,
    addressRegion: "MB",
    addressCountry: site.country,
  },
  sameAs: [site.facebookUrl],
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded bg-white px-4 py-2 font-semibold text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {children}
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
