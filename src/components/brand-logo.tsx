import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// The logo already contains the business name, so no text wordmark beside it.
// The transparent file has black text, so on dark backgrounds (`inverted`) it
// sits on a white tile using the white-background file.
export function BrandLogo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex items-center rounded-lg p-1"
      aria-label="Ermie's Roofing and Renovations, home"
    >
      <Image
        src={inverted ? "/logo/ermies-logo.png" : "/logo/ermies-logo-clear.png"}
        alt=""
        width={512}
        height={512}
        priority={!inverted}
        className={cn("w-auto", inverted ? "h-24 rounded-lg" : "h-16")}
      />
    </Link>
  );
}
