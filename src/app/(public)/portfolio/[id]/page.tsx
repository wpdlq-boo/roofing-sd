import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Tag } from "lucide-react";
import { Breadcrumbs } from "@/components/page-header";
import { QuoteBanner, QuoteButton } from "@/components/quote-cta";
import { quoteHrefForService, site } from "@/config/site";
import { getPublishedProject, getPublishedProjects } from "@/lib/data";
import { formatMonthYear } from "@/lib/format";
import { coverPhoto } from "@/lib/project-photos";
import { buckets, publicImageUrl } from "@/lib/supabase/env";
import { PhotoGallery } from "./photo-gallery";

export const revalidate = 60;

// Prerender published projects at build time; new ones render on first visit.
export async function generateStaticParams() {
  try {
    const projects = await getPublishedProjects();
    return projects.map((p) => ({ id: p.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps<"/portfolio/[id]">): Promise<Metadata> {
  const { id } = await params;
  const project = await getPublishedProject(id);
  if (!project) return { title: "Page not found" };

  const cover = coverPhoto(project);
  const description = `${project.service?.name ?? "Project"} in ${project.general_area}. ${project.description}`.slice(0, 160);
  return {
    title: `${project.title} | ${project.general_area}`,
    description,
    alternates: { canonical: `/portfolio/${project.id}` },
    openGraph: {
      title: project.title,
      description,
      images: cover ? [publicImageUrl(buckets.portfolioPhotos, cover.storage_path)] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: PageProps<"/portfolio/[id]">) {
  const { id } = await params;
  const project = await getPublishedProject(id);
  if (!project) notFound(); // SRS 3.2.3.5

  const completed = formatMonthYear(project.completion_date);
  const quoteHref = project.service ? quoteHrefForService(project.service.name) : "/quote";
  const photos = project.photos.map((photo) => ({
    id: photo.id,
    src: publicImageUrl(buckets.portfolioPhotos, photo.storage_path),
    alt: photo.alt_text || project.title, // PG-06
  }));

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Breadcrumbs items={[{ href: "/portfolio", label: "Portfolio" }, { label: project.title }]} />
        <Link
          href="/portfolio"
          className="touch-target inline-flex items-center gap-2 rounded-lg bg-surface-container-lowest px-4 text-label-lg text-primary shadow-sm hover:bg-surface-container"
        >
          <ArrowLeft className="size-4 text-secondary" aria-hidden />
          Back to Portfolio
        </Link>
      </div>

      <header className="mb-10 space-y-6 rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-headline-display text-primary">{project.title}</h1>
            <p className="text-body-lg whitespace-pre-line text-on-surface-variant">{project.description}</p>
          </div>
          <div className="shrink-0 space-y-3 rounded-lg bg-surface-container-low p-5 lg:w-72">
            <p className="text-body-md text-on-surface-variant">Planning something similar?</p>
            <QuoteButton href={quoteHref} className="w-full" />
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded bg-surface-container-low p-4">
            <dt className="flex items-center gap-1.5 text-label-sm text-on-surface-variant uppercase">
              <Tag className="size-3.5" aria-hidden /> Service
            </dt>
            <dd className="mt-1 text-label-lg text-primary">{project.service?.name ?? "—"}</dd>
          </div>
          <div className="rounded bg-surface-container-low p-4">
            <dt className="flex items-center gap-1.5 text-label-sm text-on-surface-variant uppercase">
              <MapPin className="size-3.5" aria-hidden /> General area
            </dt>
            {/* General area only, never a street address (PG-07). */}
            <dd className="mt-1 text-label-lg text-primary">{project.general_area}</dd>
          </div>
          {completed && (
            <div className="rounded bg-surface-container-low p-4">
              <dt className="flex items-center gap-1.5 text-label-sm text-on-surface-variant uppercase">
                <CalendarDays className="size-3.5" aria-hidden /> Completed
              </dt>
              <dd className="mt-1 text-label-lg text-primary">{completed}</dd>
            </div>
          )}
        </dl>
      </header>

      <section aria-labelledby="gallery-heading">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <h2 id="gallery-heading" className="text-headline-xl text-primary">
            Project Photos
          </h2>
          <p className="text-label-md text-on-surface-variant">Select a photo to enlarge it.</p>
        </div>
        <PhotoGallery photos={photos} title={project.title} />
      </section>

      <QuoteBanner
        title={`Planning a similar project in ${site.city}?`}
        text="Send us the details and photos, and we'll follow up with a free quote."
        quoteHref={quoteHref}
      />
    </>
  );
}
