"use client";

import { ChevronDown, ChevronUp, ImagePlus, RefreshCw, Star, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FieldError, adminInputClass } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { SESSION_ENDED_URL, checkImageFile, isSessionError, move, removeImages, uploadImage } from "@/lib/admin-client";
import { createClient } from "@/lib/supabase/client";
import { buckets, publicImageUrl } from "@/lib/supabase/env";
import type { ProjectWithPhotos } from "@/lib/types";
import { adminPhotoRules, fieldErrors, projectSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

type EditorPhoto = {
  key: string;
  id?: string; // set for photos already saved
  storage_path?: string;
  alt_text: string;
  file?: File;
  preview: string;
  status: "uploading" | "done" | "error";
  progress: number;
};

type Fields = {
  title: string;
  description: string;
  service_id: string;
  general_area: string;
  month: string; // "01".."12" or ""
  year: string; // "2024" or ""
  is_published: boolean;
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SAVE_FAILED = "Your changes could not be saved. Please try again.";

function fieldsFrom(project?: ProjectWithPhotos): Fields {
  const [year = "", month = ""] = project?.completion_date?.split("-") ?? [];
  return {
    title: project?.title ?? "",
    description: project?.description ?? "",
    service_id: project?.service_id ?? "",
    general_area: project?.general_area ?? "",
    month,
    year,
    is_published: project?.is_published ?? false,
  };
}

export function ProjectEditor({
  project,
  services,
  onClose,
  onSaved,
}: {
  project?: ProjectWithPhotos;
  services: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [supabase] = useState(createClient);
  const [fields, setFields] = useState<Fields>(() => fieldsFrom(project));
  const [photos, setPhotos] = useState<EditorPhoto[]>(() =>
    (project?.photos ?? []).map((p) => ({
      key: p.id,
      id: p.id,
      storage_path: p.storage_path,
      alt_text: p.alt_text ?? "",
      preview: publicImageUrl(buckets.portfolioPhotos, p.storage_path),
      status: "done",
      progress: 100,
    })),
  );
  const [coverKey, setCoverKey] = useState<string | null>(project?.cover_photo_id ?? project?.photos[0]?.id ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  // New uploads that never made it into a saved project; cleaned up on close.
  const unsavedUploads = useRef(new Set<string>());
  const folder = useRef(`projects/${project?.id ?? crypto.randomUUID()}`);

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => setFields((f) => ({ ...f, [key]: value }));
  const patchPhoto = (key: string, patch: Partial<EditorPhoto>) =>
    setPhotos((list) => list.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  async function startUpload(photo: EditorPhoto) {
    patchPhoto(photo.key, { status: "uploading", progress: 0 });
    try {
      const path = await uploadImage({
        supabase,
        bucket: buckets.portfolioPhotos,
        folder: folder.current,
        file: photo.file!,
        onProgress: (progress) => patchPhoto(photo.key, { progress }),
      });
      unsavedUploads.current.add(path);
      patchPhoto(photo.key, { status: "done", storage_path: path, progress: 100 });
    } catch {
      // Retry option for this photo only (SRS 3.2.7.5).
      patchPhoto(photo.key, { status: "error" });
    }
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const added: EditorPhoto[] = [];
    for (const file of Array.from(files)) {
      if (photos.length + added.length >= adminPhotoRules.maxProjectPhotos) {
        toast.error("A project can have at most 20 photos.");
        break;
      }
      const problem = checkImageFile(file);
      if (problem) {
        toast.error(problem); // message names the file
        continue;
      }
      added.push({
        key: crypto.randomUUID(),
        alt_text: "",
        file,
        preview: URL.createObjectURL(file),
        status: "uploading",
        progress: 0,
      });
    }
    if (added.length === 0) return;
    setPhotos((list) => [...list, ...added]);
    if (!coverKey) setCoverKey(added[0].key);
    setErrors((errs) => {
      const next = { ...errs };
      delete next.photos;
      return next;
    });
    added.forEach((p) => void startUpload(p));
  }

  function removePhoto(key: string) {
    const photo = photos.find((p) => p.key === key);
    const rest = photos.filter((p) => p.key !== key);
    setPhotos(rest);
    if (coverKey === key) setCoverKey(rest[0]?.key ?? null);
    if (photo?.file) URL.revokeObjectURL(photo.preview);
  }

  async function close() {
    // Remove uploads that were never saved to a project.
    void removeImages(supabase, buckets.portfolioPhotos, [...unsavedUploads.current]);
    onClose();
  }

  async function save() {
    const completion_month = fields.year && fields.month ? `${fields.year}-${fields.month}` : "";
    const errs: Record<string, string> = {};
    const parsed = projectSchema.safeParse({ ...fields, completion_month });
    if (!parsed.success) Object.assign(errs, fieldErrors(parsed.error));
    if ((fields.year && !fields.month) || (!fields.year && fields.month)) {
      errs.completion_month = "Choose both a month and a year, or leave both empty.";
    }
    if (photos.some((p) => p.status === "uploading")) errs.photos = "Please wait for the photos to finish uploading.";
    else if (photos.some((p) => p.status === "error")) errs.photos = "Some photos failed to upload. Retry or remove them.";
    else if (fields.is_published && photos.length === 0) errs.photos = "Add at least one photo before publishing this project."; // PM-08
    if (photos.some((p) => p.alt_text.length > 150)) errs.photos = "Photo descriptions can be at most 150 characters.";
    if (Object.keys(errs).length > 0 || !parsed.success) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    const values = parsed.data;
    const { data, error } = await supabase.rpc("save_project", {
      p_project: {
        id: project?.id ?? null,
        title: values.title,
        description: values.description,
        service_id: values.service_id,
        general_area: values.general_area,
        completion_date: completion_month ? `${completion_month}-01` : null,
        is_published: values.is_published,
      },
      p_photos: photos.map((p) => ({
        id: p.id ?? null,
        storage_path: p.storage_path,
        alt_text: p.alt_text.trim(),
        is_cover: p.key === coverKey,
      })),
    });
    setSaving(false);

    if (error) {
      if (isSessionError(error)) return window.location.assign(SESSION_ENDED_URL);
      // Entries stay in the form (SRS 3.2.7.5).
      if (error.code === "P0001") setErrors({ photos: error.message });
      else toast.error(SAVE_FAILED);
      return;
    }

    // Saved: new uploads now belong to the project; delete files of removed photos.
    unsavedUploads.current.clear();
    const removed = (data as { removed_paths: string[] }[] | null)?.[0]?.removed_paths ?? [];
    void removeImages(supabase, buckets.portfolioPhotos, removed);
    photos.forEach((p) => p.file && URL.revokeObjectURL(p.preview));
    toast.success(project ? "Project updated." : "Project added.");
    onSaved();
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 40 }, (_, i) => String(currentYear - i));

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && void close()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-headline-sm text-primary">{project ? "Edit Project" : "Add Project"}</DialogTitle>
          <DialogDescription>Fields marked * are required. Show only the general area, never a street address.</DialogDescription>
        </DialogHeader>

        <form
          id="project-form"
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="p-title">Project title *</Label>
            <input id="p-title" className={adminInputClass} maxLength={100} value={fields.title} onChange={(e) => set("title", e.target.value)} aria-invalid={Boolean(errors.title)} aria-describedby="p-title-error" />
            <FieldError id="p-title-error" message={errors.title} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-service">Service category *</Label>
              <select id="p-service" className={adminInputClass} value={fields.service_id} onChange={(e) => set("service_id", e.target.value)} aria-invalid={Boolean(errors.service_id)} aria-describedby="p-service-error">
                <option value="" disabled>
                  Choose a service
                </option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <FieldError id="p-service-error" message={errors.service_id} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-area">General area *</Label>
              <input id="p-area" className={adminInputClass} maxLength={100} placeholder="e.g. St. Vital, Winnipeg" value={fields.general_area} onChange={(e) => set("general_area", e.target.value)} aria-invalid={Boolean(errors.general_area)} aria-describedby="p-area-error" />
              <FieldError id="p-area-error" message={errors.general_area} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label htmlFor="p-desc">Description *</Label>
              <span className="text-xs text-on-surface-variant">{fields.description.length} / 2,000</span>
            </div>
            <textarea id="p-desc" rows={5} className={adminInputClass} maxLength={2000} value={fields.description} onChange={(e) => set("description", e.target.value)} aria-invalid={Boolean(errors.description)} aria-describedby="p-desc-error" />
            <FieldError id="p-desc-error" message={errors.description} />
          </div>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Completion date (optional)</legend>
            <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
              <select aria-label="Completion month" className={adminInputClass} value={fields.month} onChange={(e) => set("month", e.target.value)}>
                <option value="">Month</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={String(i + 1).padStart(2, "0")}>
                    {m}
                  </option>
                ))}
              </select>
              <select aria-label="Completion year" className={adminInputClass} value={fields.year} onChange={(e) => set("year", e.target.value)}>
                <option value="">Year</option>
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
            <FieldError id="p-date-error" message={errors.completion_month} />
          </fieldset>

          {/* Photos (PM-03, PM-04, PM-07) */}
          <section className="space-y-3" aria-labelledby="photos-heading">
            <div>
              <h3 id="photos-heading" className="text-label-lg text-primary">
                Photos {fields.is_published && "*"}
              </h3>
              <p className="text-xs text-on-surface-variant">
                1 to 20 photos, JPEG, PNG, or WebP, each up to 10 MB. Use the arrows to change the order and the star to
                pick the cover photo.
              </p>
            </div>

            {photos.length > 0 && (
              <ul className="space-y-2">
                {photos.map((photo, i) => (
                  <li key={photo.key} className={cn("flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center", coverKey === photo.key ? "border-secondary bg-secondary-fixed/30" : "border-border")}>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => setPhotos(move(photos, i, -1))} aria-label={`Move photo ${i + 1} up`}>
                          <ChevronUp />
                        </Button>
                        <Button type="button" variant="ghost" size="icon-sm" disabled={i === photos.length - 1} onClick={() => setPhotos(move(photos, i, 1))} aria-label={`Move photo ${i + 1} down`}>
                          <ChevronDown />
                        </Button>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
                      <img src={photo.preview} alt="" className="h-16 w-24 shrink-0 rounded object-cover" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <input
                        aria-label={`Description of photo ${i + 1} (for screen readers)`}
                        placeholder="Photo description (optional, for screen readers)"
                        maxLength={150}
                        className={cn(adminInputClass, "py-2 text-sm")}
                        value={photo.alt_text}
                        onChange={(e) => patchPhoto(photo.key, { alt_text: e.target.value })}
                      />
                      {photo.status === "uploading" && <Progress value={photo.progress} aria-label={`Uploading photo ${i + 1}`} />}
                      {photo.status === "error" && (
                        <p className="flex items-center gap-2 text-sm text-error">
                          Upload failed{photo.file ? ` for "${photo.file.name}"` : ""}.
                          <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => void startUpload(photo)}>
                            <RefreshCw /> Retry
                          </Button>
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant={coverKey === photo.key ? "secondary" : "ghost"}
                        size="sm"
                        className="h-10"
                        onClick={() => setCoverKey(photo.key)}
                        aria-pressed={coverKey === photo.key}
                      >
                        <Star className={cn(coverKey === photo.key && "fill-current")} />
                        {coverKey === photo.key ? "Cover photo" : "Make cover"}
                      </Button>
                      <Button type="button" variant="ghost" size="icon-lg" className="text-error hover:bg-error-container" onClick={() => removePhoto(photo.key)} aria-label={`Remove photo ${i + 1}`}>
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {photos.length < adminPhotoRules.maxProjectPhotos && (
              <label className="touch-target flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-low p-4 text-sm font-medium text-primary hover:bg-surface-container">
                <ImagePlus className="size-5" aria-hidden />
                Add photos
                <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              </label>
            )}
            <FieldError id="p-photos-error" message={errors.photos} />
          </section>

          <label className="flex items-center gap-3 rounded-lg bg-surface-container-low p-3 text-sm">
            <Switch checked={fields.is_published} onCheckedChange={(v) => set("is_published", v)} />
            <span>
              <span className="block font-medium">Published</span>
              <span className="text-on-surface-variant">When off, the project is saved as a draft and hidden from the website.</span>
            </span>
          </label>
        </form>

        <DialogFooter>
          <Button variant="outline" className="h-11 px-4" onClick={() => void close()} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" className="h-11 bg-primary-container px-4" disabled={saving}>
            {saving ? "Saving..." : "Save Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
