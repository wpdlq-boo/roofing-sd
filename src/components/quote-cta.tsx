import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

// "Request a Free Quote" button (UI-04).
export function QuoteButton({
  href = "/quote",
  children = "Request a Free Quote",
  className,
}: {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "touch-target inline-flex items-center justify-center gap-2 rounded-lg bg-secondary-container px-6 py-3 text-label-lg text-on-secondary-container shadow-md transition hover:bg-secondary-fixed hover:shadow-lg",
        className,
      )}
    >
      {children}
      <ArrowRight className="size-5" aria-hidden />
    </Link>
  );
}

export function PhoneButton({ className, variant = "light" }: { className?: string; variant?: "light" | "ghost" }) {
  return (
    <a
      href={site.phone.href}
      className={cn(
        "touch-target inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-label-lg transition",
        variant === "light"
          ? "bg-surface-container-lowest text-primary shadow-md hover:bg-surface"
          : "bg-white/10 text-on-primary hover:bg-white/20",
        className,
      )}
    >
      <Phone className={cn("size-5", variant === "light" ? "text-secondary" : "text-secondary-container")} aria-hidden />
      Call {site.phone.display}
    </a>
  );
}

// Navy closing banner used at the bottom of public pages.
export function QuoteBanner({
  title,
  text,
  quoteHref,
}: {
  title: string;
  text: string;
  quoteHref?: string;
}) {
  return (
    <section className="relative mt-16 overflow-hidden rounded-xl bg-primary-container p-8 text-on-primary shadow-xl sm:p-12">
      <div
        className="pointer-events-none absolute -right-16 -bottom-16 size-64 rounded-full bg-secondary-container/15 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div className="max-w-2xl space-y-3">
          <span className="text-label-sm text-primary-fixed uppercase">{site.serviceArea}</span>
          <h2 className="text-headline-xl text-on-primary">{title}</h2>
          <p className="text-body-md text-primary-fixed-dim">{text}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
          <QuoteButton href={quoteHref} />
          <PhoneButton variant="ghost" />
        </div>
      </div>
    </section>
  );
}
