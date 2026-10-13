import Link from "next/link";
import { House } from "lucide-react";
import { cn } from "@/lib/utils";

// Placeholder mark from the Stitch design. Swap for the real logo file when the
// client provides one.
export function BrandLogo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3 rounded-lg p-1"
      aria-label="Ermie's Roofing and Renovations, home"
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-lg shadow-md transition",
          inverted ? "bg-white/10" : "bg-primary-container group-hover:bg-tertiary-container",
        )}
      >
        <House className="size-6 text-secondary-container" strokeWidth={2.2} aria-hidden />
      </span>
      <span>
        <span
          className={cn(
            "block text-lg leading-tight font-extrabold tracking-tight sm:text-xl",
            inverted ? "text-white" : "text-primary-container",
          )}
        >
          Ermie&apos;s Roofing
        </span>
        <span
          className={cn(
            "block text-xs font-semibold tracking-wider uppercase",
            inverted ? "text-secondary-container" : "text-secondary",
          )}
        >
          &amp; Renovations
        </span>
      </span>
    </Link>
  );
}
