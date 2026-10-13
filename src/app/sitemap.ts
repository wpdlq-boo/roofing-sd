import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { getPublishedProjects } from "@/lib/data";

// All public pages and published projects (OR-03).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/about", "/services", "/portfolio", "/faq", "/contact", "/quote", "/privacy"].map(
    (path) => ({ url: `${site.url}${path}`, changeFrequency: "weekly" as const }),
  );

  let projects: MetadataRoute.Sitemap = [];
  try {
    projects = (await getPublishedProjects()).map((p) => ({
      url: `${site.url}/portfolio/${p.id}`,
      lastModified: p.updated_at,
    }));
  } catch {
    // Leave projects out if the database is unreachable.
  }

  return [...pages, ...projects];
}
