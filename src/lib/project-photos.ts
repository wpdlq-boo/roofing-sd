import type { ProjectWithPhotos } from "@/lib/types";

export function coverPhoto(project: ProjectWithPhotos) {
  return (
    project.photos.find((photo) => photo.id === project.cover_photo_id) ??
    project.photos[0] ??
    null
  );
}
