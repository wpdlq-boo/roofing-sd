"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CircleHelp, ExternalLink, Images, LayoutDashboard, LogOut, Menu, Wrench } from "lucide-react";
import { IdleLogout } from "@/components/admin/idle-logout";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { hardNavigate } from "@/lib/admin-client";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/portfolio", label: "Manage Portfolio", icon: Images },
  { href: "/admin/services", label: "Manage Services", icon: Wrench },
  { href: "/admin/faqs", label: "Manage FAQs", icon: CircleHelp },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex-1 space-y-1 px-3 py-4">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "touch-target flex items-center gap-3 rounded-xl px-4 text-label-md transition-colors",
              active
                ? "bg-primary-container text-on-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex h-16 items-center gap-3 bg-primary-container px-4 text-on-primary">
      <Image src="/logo/ermies-logo.png" alt="" width={36} height={36} className="size-9 shrink-0 rounded-lg" />
      <span className="min-w-0">
        <span className="block truncate text-label-lg">Ermie&apos;s Roofing</span>
        <span className="block text-label-sm text-primary-fixed-dim uppercase">Admin</span>
      </span>
    </div>
  );
}

export function AdminShell({ email, children }: { email?: string; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Log out ends the session immediately (AA-06).
  async function logOut() {
    await createClient().auth.signOut();
    hardNavigate("/admin/login?reason=logged-out");
  }

  return (
    <div className="min-h-screen bg-surface">
      <IdleLogout />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] lg:flex">
        <Brand />
        <NavLinks />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 gap-0 p-0">
          <SheetTitle className="sr-only">Admin menu</SheetTitle>
          <Brand />
          <NavLinks onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 bg-surface-container-lowest/90 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="touch-target flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high lg:hidden"
              aria-label="Open admin menu"
            >
              <Menu className="size-6" />
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target inline-flex items-center gap-1.5 text-label-md text-secondary hover:underline"
            >
              <ExternalLink className="size-4" aria-hidden />
              View website
            </a>
          </div>
          <div className="flex items-center gap-3">
            {email && (
              <span className="hidden rounded-full bg-surface-container-low px-3 py-1 text-sm text-on-surface-variant md:inline">
                {email}
              </span>
            )}
            <button
              type="button"
              onClick={logOut}
              className="touch-target inline-flex items-center gap-1.5 rounded-lg px-3 text-label-md text-error hover:bg-error-container hover:text-on-error-container"
            >
              <LogOut className="size-5" aria-hidden />
              Log Out
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">{children}</main>
      </div>

      <Toaster theme="light" position="top-center" richColors closeButton />
    </div>
  );
}
