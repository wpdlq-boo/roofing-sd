import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Page not found" };

// "Page not found" with a link back to the Portfolio (SRS 3.2.3.5).
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <span className="mb-6 flex size-16 items-center justify-center rounded-full bg-surface-container-high text-primary-container">
          <SearchX className="size-8" aria-hidden />
        </span>
        <h1 className="text-headline-display text-primary">Page not found</h1>
        <p className="mt-4 text-body-lg text-on-surface-variant">
          The page you&apos;re looking for doesn&apos;t exist or is no longer available.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/portfolio"
            className="touch-target inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-6 text-label-lg text-on-primary"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to the Portfolio
          </Link>
          <Link
            href="/"
            className="touch-target inline-flex items-center justify-center rounded-lg bg-surface-container px-6 text-label-lg text-primary"
          >
            Go to the home page
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
