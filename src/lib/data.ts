import "server-only";

import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Faq, ProjectWithPhotos, Service } from "@/lib/types";

// Public read queries. Errors are thrown rather than swallowed: during an ISR
// refresh a thrown error keeps the last good version of the page online
// (REL-03). Each page's error boundary covers a first render that fails.

// `portfolio_projects` and `project_photos` are linked twice (a photo's
// project_id, and a project's cover_photo_id), so the embed must name the
// foreign key to use: `!project_id`.
const projectSelect =
  "*, service:services(id, name), photos:project_photos!project_id(id, project_id, storage_path, alt_text, display_order)";

function sortPhotos(project: ProjectWithPhotos): ProjectWithPhotos {
  return {
    ...project,
    photos: [...project.photos].sort((a, b) => a.display_order - b.display_order),
  };
}

export const getVisibleServices = cache(async (): Promise<Service[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await createPublicClient()
    .from("services")
    .select("*")
    .eq("is_visible", true)
    .order("display_order")
    .order("name");
  if (error) throw new Error(`Could not load services: ${error.message}`);
  return data;
});

export const getPublishedProjects = cache(async (): Promise<ProjectWithPhotos[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await createPublicClient()
    .from("portfolio_projects")
    .select(projectSelect)
    .eq("is_published", true)
    // Newest completion first; projects without a date go last (PG-01).
    .order("completion_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load projects: ${error.message}`);
  return (data as ProjectWithPhotos[]).map(sortPhotos);
});

export const getPublishedProject = cache(
  async (id: string): Promise<ProjectWithPhotos | null> => {
    if (!isSupabaseConfigured) return null;
    // Anything that is not a UUID cannot match a project.
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { data, error } = await createPublicClient()
      .from("portfolio_projects")
      .select(projectSelect)
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(`Could not load project: ${error.message}`);
    return data ? sortPhotos(data as ProjectWithPhotos) : null;
  },
);

export const getVisibleFaqs = cache(async (): Promise<Faq[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await createPublicClient()
    .from("faqs")
    .select("*")
    .eq("is_visible", true)
    .order("display_order")
    .order("created_at");
  if (error) throw new Error(`Could not load FAQs: ${error.message}`);
  return data as Faq[];
});
