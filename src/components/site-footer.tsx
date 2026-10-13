import Link from "next/link";
import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { FacebookIcon } from "@/components/facebook-icon";
import { publicNav, site } from "@/config/site";

// Footer on every public page: phone, email, service area, Facebook (UI-02),
// Privacy Policy link (OR-06) and copyright (OR-07).
export function SiteFooter() {
  return (
    <footer className="mt-auto bg-primary-container text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <BrandLogo inverted />
            <p className="text-sm leading-relaxed">
              Residential roofing, gutters, chimney removal, and renovations for homeowners in{" "}
              {site.serviceArea}.
            </p>
            <a
              href={site.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-[#1877f2]"
            >
              <FacebookIcon className="size-4" />
              Follow us on Facebook
              <ExternalLink className="size-3.5 text-slate-300" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold tracking-wider text-white uppercase">Contact</h2>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={site.phone.href} className="touch-target inline-flex items-center gap-3 hover:text-secondary-container">
                  <Phone className="size-4 text-secondary-container" aria-hidden />
                  <span>
                    <span className="block text-xs text-slate-400">Phone (tap to call)</span>
                    <span className="font-bold text-white">{site.phone.display}</span>
                  </span>
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="touch-target inline-flex items-center gap-3 hover:text-secondary-container">
                  <Mail className="size-4 text-secondary-container" aria-hidden />
                  <span>
                    <span className="block text-xs text-slate-400">Email</span>
                    <span className="font-bold break-all text-white">{site.email}</span>
                  </span>
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold tracking-wider text-white uppercase">Service Area</h2>
            <p className="flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-secondary-container" aria-hidden />
              {site.serviceArea}, {site.region}. Residential customers only.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold tracking-wider text-white uppercase">Quick Links</h2>
            <ul className="space-y-1 text-sm">
              {publicNav.slice(1).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="touch-target inline-flex items-center hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/quote" className="touch-target inline-flex items-center hover:text-white">
                  Request a Free Quote
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="touch-target inline-flex items-center font-medium text-secondary-container hover:text-secondary-fixed"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-slate-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <Link href="/admin/login" className="hover:text-slate-200">
            Admin login
          </Link>
        </div>
      </div>
    </footer>
  );
}
