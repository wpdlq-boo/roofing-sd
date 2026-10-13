import Link from "next/link";
import { House } from "lucide-react";
import type { ReactNode } from "react";

type Crumb = { href?: string; label: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-label-md text-on-surface-variant">
        <li>
          <Link href="/" className="touch-target inline-flex items-center gap-1.5 hover:text-primary">
            <House className="size-4" aria-hidden />
            Home
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span aria-hidden className="text-outline-variant">
              /
            </span>
            {item.href ? (
              <Link href={item.href} className="touch-target inline-flex items-center hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="max-w-[16rem] truncate font-semibold text-secondary sm:max-w-md">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded bg-primary-container px-3.5 py-1.5 text-label-sm text-on-primary uppercase shadow-sm">
      <span className="size-2 rounded-full bg-secondary-container" aria-hidden />
      {children}
    </span>
  );
}

export function PageHeader({
  crumbs,
  eyebrow,
  title,
  intro,
  aside,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: string;
  intro: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="mb-10 rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-10">
      <Breadcrumbs items={crumbs} />
      <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="text-headline-display text-primary">{title}</h1>
          <div className="max-w-3xl text-body-lg text-on-surface-variant">{intro}</div>
        </div>
        {aside && <div className="lg:col-span-4">{aside}</div>}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <span className="mb-1 block text-label-sm text-secondary uppercase">{eyebrow}</span>
        <h2 className="text-headline-xl text-primary">{title}</h2>
      </div>
      {children && <div className="max-w-md text-body-md text-on-surface-variant">{children}</div>}
    </div>
  );
}
