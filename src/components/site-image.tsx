"use client";

import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// next/image serves screen-sized, lazy-loaded photos (PG-05). If a photo fails
// to load, a neutral placeholder takes its place (SRS 3.2.3.5).
export function SiteImage({ className, alt, ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-center justify-center bg-surface-container text-on-surface-variant",
          props.fill && "absolute inset-0",
          className,
        )}
      >
        <ImageOff className="size-8" aria-hidden />
      </div>
    );
  }

  return <Image alt={alt} className={className} onError={() => setFailed(true)} {...props} />;
}

export function PhotoPlaceholder({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-primary-container to-tertiary-container text-primary-fixed-dim",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-12 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="m3 10 9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 9v11h14V9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
