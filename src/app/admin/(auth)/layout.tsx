import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md rounded-xl bg-surface-container-lowest p-6 shadow-[0_8px_24px_-4px_rgba(15,38,66,0.08)] sm:p-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/logo/ermies-logo-clear.png" alt="" width={112} height={112} className="mb-3 size-28" priority />
          <span className="text-label-sm text-secondary uppercase">Ermie&apos;s Roofing</span>
        </div>
        {children}
        <p className="mt-8 text-center text-sm">
          <Link href="/" className="text-on-surface-variant hover:text-primary hover:underline">
            ← Back to the website
          </Link>
        </p>
      </div>
    </main>
  );
}
