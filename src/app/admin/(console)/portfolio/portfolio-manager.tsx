"use client";

import { Camera, Eye, EyeOff, MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader, ConfirmDelete, StatusPill } from "@/components/admin/admin-ui";
import { PhotoPlaceholder } from "@/components/site-image";
import { Button } from "@/components/ui/button";
import { SESSION_ENDED_URL, hardNavigate, isSessionError, refreshPublicSite, removeImages } from "@/lib/admin-client";
import { formatMonthYear } from "@/lib/format";
import { coverPhoto } from "@/lib/project-photos";
import { createClient } from "@/lib/supabase/client";
import { buckets, publicImageUrl } from "@/lib/supabase/env";
import type { ProjectWithPhotos } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProjectEditor } from "./project-editor";

type Filter = "all" | "published" | "draft";

export function PortfolioManager({ openNew }: { openNew: boolean }) {
  const [supabase] = useState(createClient);
  const [projects, setProjects] = useState<ProjectWithPhotos[] | null>(null);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ProjectWithPhotos | "new" | null>(openNew ? "new" : null);
  const [toDelete, setToDelete] = useState<ProjectWithPhotos | null>(null);

  const load = useCallback(async () => {
    const [projectsRes, servicesRes] = await Promise.all([
      supabase
        .from("portfolio_projects")
        .select("*, service:services(id, name), photos:project_photos(id, project_id, storage_path, alt_text, display_order)")
        .order("completion_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false }),
      supabase.from("services").select("id, name").order("display_order").order("name"),
    ]);
    const error = projectsRes.error ?? servicesRes.error;
    if (error) {
      if (isSessionError(error)) return hardNavigate(SESSION_ENDED_URL);
      setLoadError(true);
      return;
    }
    setLoadError(false);
    setProjects(
      (projectsRes.data as ProjectWithPhotos[]).map((p) => ({
        ...p,
        photos: [...p.photos].sort((a, b) => a.display_order - b.display_order),
      })),
    );
    setServices(servicesRes.data ?? []);
  }, [supabase]);

  useEffect(() => {
    // Load once on mount. Deferred to a microtask so state is never set
    // synchronously inside the effect.
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  const counts = useMemo(() => {
    const list = projects ?? [];
    const published = list.filter((p) => p.is_published).length;
    return { all: list.length, published, draft: list.length - published };
  }, [projects]);

  const visible = (projects ?? []).filter((p) => {
    if (filter === "published" && !p.is_published) return false;
    if (filter === "draft" && p.is_published) return false;
    const q = search.trim().toLowerCase();
    return !q || `${p.title} ${p.general_area} ${p.service?.name ?? ""}`.toLowerCase().includes(q);
  });

  async function togglePublished(project: ProjectWithPhotos) {
    const is_published = !project.is_published;
    if (is_published && project.photos.length === 0) {
      toast.error("Add at least one photo before publishing this project."); // PM-08
      return;
    }
    const { error } = await supabase.from("portfolio_projects").update({ is_published }).eq("id", project.id);
    if (error) {
      if (isSessionError(error)) return hardNavigate(SESSION_ENDED_URL);
      toast.error("Your changes could not be saved. Please try again.");
      return;
    }
    toast.success(is_published ? "Project published." : "Project unpublished and hidden from the website.");
    await load();
    void refreshPublicSite();
  }

  async function remove(project: ProjectWithPhotos) {
    // Deleting the project deletes its photo rows; then remove the files (PM-06).
    const paths = project.photos.map((p) => p.storage_path);
    const { error } = await supabase.from("portfolio_projects").delete().eq("id", project.id);
    setToDelete(null);
    if (error) {
      if (isSessionError(error)) return hardNavigate(SESSION_ENDED_URL);
      toast.error("The project could not be deleted. Please try again.");
      return;
    }
    await removeImages(supabase, buckets.portfolioPhotos, paths);
    toast.success("Project and its photos deleted.");
    await load();
    void refreshPublicSite();
  }

  const pill = (active: boolean) =>
    cn(
      "touch-target rounded-md px-4 text-label-md transition-colors",
      active ? "bg-primary-container text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high",
    );

  return (
    <>
      <AdminPageHeader
        title="Portfolio Projects"
        description="Add, edit, publish, or delete completed projects shown in the public gallery."
        action={
          <Button
            className="h-11 bg-secondary-container px-4 text-label-lg text-on-secondary-container hover:bg-secondary-fixed"
            onClick={() => setEditing("new")}
            disabled={services.length === 0 && projects !== null}
          >
            <Plus className="size-5" aria-hidden /> Add Project
          </Button>
        }
      />

      {projects !== null && services.length === 0 && (
        <p className="mb-4 rounded-xl bg-secondary-fixed/40 p-4 text-sm text-on-surface">
          Add at least one service first. Each project needs a service category.
        </p>
      )}

      <div className="mb-6 flex flex-col justify-between gap-3 rounded-xl bg-surface-container-lowest p-3 shadow-sm md:flex-row md:items-center">
        <div role="group" aria-label="Filter by status" className="flex gap-1 overflow-x-auto rounded-lg bg-surface-container-low p-1">
          <button type="button" aria-pressed={filter === "all"} className={pill(filter === "all")} onClick={() => setFilter("all")}>
            All ({counts.all})
          </button>
          <button type="button" aria-pressed={filter === "published"} className={pill(filter === "published")} onClick={() => setFilter("published")}>
            Published ({counts.published})
          </button>
          <button type="button" aria-pressed={filter === "draft"} className={pill(filter === "draft")} onClick={() => setFilter("draft")}>
            Drafts ({counts.draft})
          </button>
        </div>
        <div className="relative md:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-outline" aria-hidden />
          <input
            type="search"
            aria-label="Search projects"
            placeholder="Search by title, area, or service"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-lg bg-surface pr-3 pl-10 text-base focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>

      {loadError && (
        <p role="alert" className="rounded-xl bg-error-container p-4 text-on-error-container">
          The projects could not be loaded.{" "}
          <button type="button" className="font-semibold underline" onClick={() => void load()}>
            Try again
          </button>
        </p>
      )}
      {projects === null && !loadError && <p className="text-on-surface-variant">Loading projects...</p>}
      {projects !== null && visible.length === 0 && (
        <p className="rounded-xl bg-surface-container-lowest p-6 text-on-surface-variant shadow-sm">
          {projects.length === 0 ? "No projects yet. Select Add Project to create the first one." : "No projects match this filter."}
        </p>
      )}

      {/* PM-01: every project with cover, title and status */}
      {visible.length > 0 && (
        <ul className="divide-y divide-surface-container overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          {visible.map((project) => {
            const cover = coverPhoto(project);
            const completed = formatMonthYear(project.completion_date);
            return (
              <li key={project.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                    <img src={publicImageUrl(buckets.portfolioPhotos, cover.storage_path)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <PhotoPlaceholder className="h-full w-full [&_svg]:size-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-label-lg text-on-surface">{project.title}</p>
                    <StatusPill on={project.is_published} onLabel="Published" offLabel="Draft" />
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-on-surface-variant">
                    <span className="rounded bg-surface-container px-2 py-0.5 text-primary">{project.service?.name ?? "No service"}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-4 text-secondary" aria-hidden />
                      {project.general_area}
                    </span>
                    {completed && <span>{completed}</span>}
                    <span className="inline-flex items-center gap-1">
                      <Camera className="size-4" aria-hidden />
                      {project.photos.length} {project.photos.length === 1 ? "photo" : "photos"}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="icon-lg" onClick={() => setEditing(project)} aria-label={`Edit ${project.title}`}>
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    onClick={() => togglePublished(project)}
                    aria-label={project.is_published ? `Unpublish ${project.title}` : `Publish ${project.title}`}
                    title={project.is_published ? "Unpublish" : "Publish"}
                  >
                    {project.is_published ? <EyeOff /> : <Eye />}
                  </Button>
                  <Button variant="ghost" size="icon-lg" className="text-error hover:bg-error-container" onClick={() => setToDelete(project)} aria-label={`Delete ${project.title}`}>
                    <Trash2 />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <ProjectEditor
          key={editing === "new" ? "new" : editing.id}
          project={editing === "new" ? undefined : editing}
          services={services}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
            void refreshPublicSite();
          }}
        />
      )}

      <ConfirmDelete
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete this project?"
        description={toDelete ? `"${toDelete.title}" and all ${toDelete.photos.length} of its photos will be permanently deleted.` : ""}
        onConfirm={async () => {
          if (toDelete) await remove(toDelete);
        }}
      />
    </>
  );
}
