import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { PhotoPlaceholder, SiteImage } from "@/components/site-image";
import { coverPhoto } from "@/lib/project-photos";
import { buckets, publicImageUrl } from "@/lib/supabase/env";
import { formatMonthYear } from "@/lib/format";
import type { ProjectWithPhotos } from "@/lib/types";

// Portfolio card: cover photo, title, category, and general area (PG-01).
export function ProjectCard({ project }: { project: ProjectWithPhotos }) {
  const cover = coverPhoto(project);
  const completed = formatMonthYear(project.completion_date);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container">
        {cover ? (
          <SiteImage
            src={publicImageUrl(buckets.portfolioPhotos, cover.storage_path)}
            alt={cover.alt_text || project.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <PhotoPlaceholder className="absolute inset-0" />
        )}
        {project.service && (
          <span className="absolute top-3 left-3 rounded bg-primary-container/95 px-2.5 py-1 text-label-sm text-on-primary">
            {project.service.name}
          </span>
        )}
        {completed && (
          <span className="absolute right-3 bottom-3 rounded bg-tertiary-container/85 px-2 py-0.5 text-label-sm text-tertiary-fixed backdrop-blur-sm">
            Completed {completed}
          </span>
        )}
      </div>
      <div className="flex flex-grow flex-col justify-between gap-4 p-6">
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-label-md text-on-surface-variant">
            <MapPin className="size-4 text-secondary" aria-hidden />
            {project.general_area}
          </p>
          <h3 className="text-headline-sm text-primary">
            {/* The stretched link makes the whole card clickable (PG-03). */}
            <Link href={`/portfolio/${project.id}`} className="after:absolute after:inset-0">
              {project.title}
            </Link>
          </h3>
          <p className="line-clamp-2 text-body-md text-on-surface-variant">{project.description}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-label-lg text-secondary transition-transform group-hover:translate-x-1">
          View project details
          <ArrowRight className="size-4" aria-hidden />
        </span>
      </div>
    </article>
  );
}
