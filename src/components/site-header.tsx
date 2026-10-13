"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { publicNav, site } from "@/config/site";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Utility bar */}
      <div className="bg-tertiary text-sm text-slate-200">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1.5 sm:px-6 lg:px-8">
          <span className="hidden items-center gap-1.5 md:inline-flex">
            <MapPin className="size-4 text-secondary-container" aria-hidden />
            Serving {site.serviceArea}
          </span>
          <div className="flex items-center gap-5">
            <a href={site.phone.href} className="touch-target inline-flex items-center gap-1.5 hover:text-white">
              <Phone className="size-4 text-secondary-container" aria-hidden />
              <span className="font-bold text-white">{site.phone.display}</span>
            </a>
            <a
              href={`mailto:${site.email}`}
              className="touch-target hidden items-center gap-1.5 hover:text-white sm:inline-flex"
            >
              <Mail className="size-4 text-slate-400" aria-hidden />
              {site.email}
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-4">
            <BrandLogo />

            <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
              {publicNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className={cn(
                    "touch-target inline-flex items-center rounded-md px-3 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary-container",
                    isActive(pathname, item.href) && "bg-surface-container-low text-primary-container",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/quote"
              className="touch-target hidden items-center gap-2 rounded-lg bg-secondary-container px-5 text-label-md text-on-secondary-container shadow-md transition hover:bg-secondary-fixed lg:inline-flex"
            >
              Request a Free Quote
              <ArrowRight className="size-4" aria-hidden />
            </Link>

            {/* Menu button below 768px (UI-03) */}
            <button
              type="button"
              className="touch-target inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>

          {open && (
            <nav
              id="mobile-menu"
              aria-label="Main"
              className="space-y-1 border-t border-border py-4 md:hidden"
              // Close the menu once a link is chosen.
              onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
            >
              {publicNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className={cn(
                    "touch-target flex items-center rounded-md px-3 text-base font-semibold text-on-surface-variant hover:bg-surface-container-low",
                    isActive(pathname, item.href) && "bg-surface-container-low text-primary-container",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-3">
                <Link
                  href="/quote"
                  className="touch-target flex w-full items-center justify-center rounded-lg bg-secondary-container px-4 font-bold text-on-secondary-container shadow"
                >
                  Request a Free Quote
                </Link>
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  );
}
