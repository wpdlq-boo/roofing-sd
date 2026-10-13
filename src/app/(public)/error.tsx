"use client";

import { TriangleAlert } from "lucide-react";
import { site } from "@/config/site";

// Shown if a page's content can't be loaded on its first render. Phone and
// email stay available (SRS 3.2.2.5, 3.2.9.5).
export default function PublicError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl rounded-xl bg-surface-container-lowest p-8 text-center shadow-sm sm:p-12">
      <TriangleAlert className="mx-auto mb-4 size-10 text-secondary" aria-hidden />
      <h1 className="text-headline-lg text-primary">This page is being updated</h1>
      <p className="mt-3 text-body-lg text-on-surface-variant">
        Please try again in a moment, or call us at{" "}
        <a href={site.phone.href} className="font-semibold text-secondary">
          {site.phone.display}
        </a>{" "}
        or email{" "}
        <a href={`mailto:${site.email}`} className="font-semibold text-secondary break-all">
          {site.email}
        </a>
        .
      </p>
      <button
        type="button"
        onClick={reset}
        className="touch-target mt-6 inline-flex items-center rounded-lg bg-primary-container px-6 text-label-lg text-on-primary"
      >
        Try again
      </button>
    </div>
  );
}
