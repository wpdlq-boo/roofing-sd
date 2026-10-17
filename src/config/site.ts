// Business details and fixed lists live here so each one changes in one place
// (SRS MNT-04, MNT-05).
//
// TODO(client): replace the placeholder domain (NEXT_PUBLIC_SITE_URL) before launch.

export const site = {
  name: "Ermie's Roofing and Renovations",
  shortName: "Ermie's Roofing",
  tagline: "Residential roofing and renovations in Winnipeg and surrounding areas",
  // Used for canonical URLs, sitemap.xml and Open Graph tags.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  phone: {
    display: "(204) 781-0806",
    href: "tel:+12047810806",
  },
  email: "porlaje.michael@yahoo.com",
  serviceArea: "Winnipeg and surrounding areas",
  city: "Winnipeg",
  region: "Manitoba",
  country: "CA",
  facebookUrl: "https://www.facebook.com/profile.php?id=61576997528729",
} as const;

// The quote form's Type of Service options, in this exact order (QR-01).
// Admin edits to the services catalog never change this list (SM-08).
export const quoteServiceOptions = [
  { value: "roof-repair", label: "Roof Repair" },
  { value: "roof-replacement", label: "Roof Replacement" },
  { value: "gutter-cleaning", label: "Gutter Cleaning" },
  { value: "gutter-guards", label: "Installation of Gutter Guards" },
  { value: "chimney-removal", label: "Chimney Removal" },
  { value: "renovations", label: "Renovations" },
] as const;

export type QuoteServiceValue = (typeof quoteServiceOptions)[number]["value"];

// Maps a catalog service name to the quote option it preselects (SC-03).
// Roof Installation preselects Roof Replacement.
const serviceNameToQuoteOption: Record<string, QuoteServiceValue> = {
  "roof installation": "roof-replacement",
  "roof repair": "roof-repair",
  "roof replacement": "roof-replacement",
  "gutter cleaning": "gutter-cleaning",
  "installation of gutter guards": "gutter-guards",
  "gutter guards": "gutter-guards",
  "chimney removal": "chimney-removal",
  renovations: "renovations",
  "home renovations": "renovations",
};

export function quoteHrefForService(serviceName: string): string {
  const option = serviceNameToQuoteOption[serviceName.trim().toLowerCase()];
  return option ? `/quote?service=${option}` : "/quote";
}

// FAQ categories, in display order (FQ-01).
export const faqCategories = [
  "Our Services",
  "Service Area",
  "Requesting a Quote",
  "General",
] as const;

export type FaqCategory = (typeof faqCategories)[number];

export const publicNav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;
