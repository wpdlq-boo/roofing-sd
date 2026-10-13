"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "@/components/project-card";
import type { ProjectWithPhotos } from "@/lib/types";
import { cn } from "@/lib/utils";

// Filters cards by service category in the browser (PG-02).
export function PortfolioGallery({ projects }: { projects: ProjectWithPhotos[] }) {
  const [filter, setFilter] = useState<string>("all");

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of projects) if (p.service) seen.set(p.service.id, p.service.name);
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [projects]);

  const visible = filter === "all" ? projects : projects.filter((p) => p.service_id === filter);

  const pill = (active: boolean) =>
    cn(
      "touch-target rounded px-4 text-label-md whitespace-nowrap transition-colors",
      active
        ? "bg-primary-container text-on-primary shadow-sm"
        : "text-on-surface-variant hover:bg-surface-container-highest hover:text-primary",
    );

  return (
    <>
      <div
        role="group"
        aria-label="Filter projects by service"
        className="mb-8 flex gap-2 overflow-x-auto rounded-lg bg-surface-container-low p-2 shadow-sm"
      >
        <button type="button" aria-pressed={filter === "all"} className={pill(filter === "all")} onClick={() => setFilter("all")}>
          All projects ({projects.length})
        </button>
        {categories.map(([id, name]) => (
          <button key={id} type="button" aria-pressed={filter === id} className={pill(filter === id)} onClick={() => setFilter(id)}>
            {name}
          </button>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {visible.length} {visible.length === 1 ? "project" : "projects"}
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </>
  );
}
