"use client";

import { ChevronDown, ChevronUp, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader, ConfirmDelete, FieldError, StatusPill, adminInputClass } from "@/components/admin/admin-ui";
import { PhotoPlaceholder } from "@/components/site-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { quoteHrefForService, quoteServiceOptions } from "@/config/site";
import {
  SESSION_ENDED_URL,
  hardNavigate,
  checkImageFile,
  isSessionError,
  move,
  refreshPublicSite,
  removeImages,
  uploadImage,
} from "@/lib/admin-client";
import { createClient } from "@/lib/supabase/client";
import { buckets, publicImageUrl } from "@/lib/supabase/env";
import type { Service } from "@/lib/types";
import { fieldErrors, serviceSchema } from "@/lib/validation";

type Draft = {
  id?: string;
  name: string;
  short_description: string;
  full_description: string;
  is_visible: boolean;
  image_path: string | null; // current saved image
  newFile: File | null;
  newPreview: string | null;
  removeImage: boolean;
};

const emptyDraft: Draft = {
  name: "",
  short_description: "",
  full_description: "",
  is_visible: true,
  image_path: null,
  newFile: null,
  newPreview: null,
  removeImage: false,
};

const SAVE_FAILED = "Your changes could not be saved. Please try again.";

function quoteLabel(name: string) {
  const value = new URLSearchParams(quoteHrefForService(name).split("?")[1] ?? "").get("service");
  return quoteServiceOptions.find((o) => o.value === value)?.label;
}

export function ServiceManager({ openNew }: { openNew: boolean }) {
  const [supabase] = useState(createClient);
  const [services, setServices] = useState<Service[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(openNew ? emptyDraft : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("services").select("*").order("display_order").order("name");
    if (error) {
      if (isSessionError(error)) return hardNavigate(SESSION_ENDED_URL);
      setLoadError(true);
      return;
    }
    setLoadError(false);
    setServices(data as Service[]);
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

  function fail(error: { code?: string; message?: string }, fallback = SAVE_FAILED) {
    if (isSessionError(error)) {
      hardNavigate(SESSION_ENDED_URL);
      return;
    }
    toast.error(fallback);
  }

  function closeEditor() {
    if (draft?.newPreview) URL.revokeObjectURL(draft.newPreview);
    setDraft(null);
    setProgress(null);
  }

  function pickImage(file: File | undefined) {
    if (!file || !draft) return;
    const problem = checkImageFile(file);
    if (problem) {
      setErrors((e) => ({ ...e, image: problem }));
      return;
    }
    if (draft.newPreview) URL.revokeObjectURL(draft.newPreview);
    setErrors((errs) => {
      const next = { ...errs };
      delete next.image;
      return next;
    });
    setDraft({ ...draft, newFile: file, newPreview: URL.createObjectURL(file), removeImage: false });
  }

  async function save() {
    if (!draft || !services) return;
    const parsed = serviceSchema.safeParse(draft);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setSaving(true);

    let uploadedPath: string | null = null;
    if (draft.newFile) {
      try {
        setProgress(0);
        uploadedPath = await uploadImage({
          supabase,
          bucket: buckets.serviceImages,
          folder: "services",
          file: draft.newFile,
          onProgress: setProgress,
        });
      } catch {
        setSaving(false);
        setProgress(null);
        setErrors((e) => ({ ...e, image: `"${draft.newFile!.name}" could not be uploaded. Select Save to retry.` }));
        return;
      }
    }

    const image_path = uploadedPath ?? (draft.removeImage ? null : draft.image_path);
    const values = { ...parsed.data, image_path };
    const nextOrder = Math.max(0, ...services.map((s) => s.display_order)) + 1;

    const { error } = draft.id
      ? await supabase.from("services").update(values).eq("id", draft.id)
      : await supabase.from("services").insert({ ...values, display_order: nextOrder });
    setSaving(false);
    setProgress(null);

    if (error) {
      // Don't leave an orphaned upload behind.
      if (uploadedPath) void removeImages(supabase, buckets.serviceImages, [uploadedPath]);
      if (error.code === "23505") {
        setErrors({ name: "A service with this name already exists." });
        return;
      }
      return fail(error);
    }

    // The old image is no longer used.
    if (draft.image_path && draft.image_path !== image_path) {
      void removeImages(supabase, buckets.serviceImages, [draft.image_path]);
    }
    toast.success(draft.id ? "Service updated." : "Service added.");
    closeEditor();
    await load();
    void refreshPublicSite();
  }

  async function toggleVisible(service: Service, is_visible: boolean) {
    const { error } = await supabase.from("services").update({ is_visible }).eq("id", service.id);
    if (error) return fail(error);
    toast.success(is_visible ? `${service.name} is now shown on the website.` : `${service.name} is now hidden from the website.`);
    await load();
    void refreshPublicSite();
  }

  async function reorder(index: number, delta: number) {
    if (!services) return;
    const next = move(services, index, delta);
    if (next === services) return;
    const { error } = await supabase.rpc("reorder_services", { p_ids: next.map((s) => s.id) });
    if (error) return fail(error, "The order could not be saved. Please try again.");
    toast.success("Order updated.");
    await load();
    void refreshPublicSite();
  }

  async function remove(service: Service) {
    const { error } = await supabase.from("services").delete().eq("id", service.id);
    if (error) {
      setToDelete(null);
      if (error.code === "23503") {
        // SRS 3.2.8.5, DB-04
        toast.error("This service is used by one or more portfolio projects. Hide it instead, or change those projects first.");
        return;
      }
      return fail(error, "The service could not be deleted. Please try again.");
    }
    if (service.image_path) void removeImages(supabase, buckets.serviceImages, [service.image_path]);
    setToDelete(null);
    toast.success("Service deleted.");
    await load();
    void refreshPublicSite();
  }

  const preview = draft?.newPreview ?? (draft?.image_path && !draft.removeImage ? publicImageUrl(buckets.serviceImages, draft.image_path) : null);

  return (
    <>
      <AdminPageHeader
        title="Services Catalog"
        description="These services appear on the Services page in this order. The quote form's service list stays fixed and is not affected by changes here."
        action={
          <Button
            className="h-11 bg-secondary-container px-4 text-label-lg text-on-secondary-container hover:bg-secondary-fixed"
            onClick={() => {
              setErrors({});
              setDraft(emptyDraft);
            }}
          >
            <Plus className="size-5" aria-hidden /> Add Service
          </Button>
        }
      />

      {loadError && (
        <p role="alert" className="rounded-xl bg-error-container p-4 text-on-error-container">
          The services could not be loaded.{" "}
          <button type="button" className="font-semibold underline" onClick={() => void load()}>
            Try again
          </button>
        </p>
      )}
      {services === null && !loadError && <p className="text-on-surface-variant">Loading services...</p>}
      {services?.length === 0 && (
        <p className="rounded-xl bg-surface-container-lowest p-6 text-on-surface-variant shadow-sm">
          No services yet. Select Add Service to create the first one.
        </p>
      )}

      {services && services.length > 0 && (
        <ul className="divide-y divide-surface-container overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          {services.map((service, i) => (
            <li key={service.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <div className="flex shrink-0 gap-1 md:flex-col">
                  <Button variant="ghost" size="icon-lg" disabled={i === 0} onClick={() => reorder(i, -1)} aria-label={`Move ${service.name} up`}>
                    <ChevronUp />
                  </Button>
                  <Button variant="ghost" size="icon-lg" disabled={i === services.length - 1} onClick={() => reorder(i, 1)} aria-label={`Move ${service.name} down`}>
                    <ChevronDown />
                  </Button>
                </div>
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                  {service.image_path ? (
                    // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
                    <img src={publicImageUrl(buckets.serviceImages, service.image_path)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <PhotoPlaceholder className="h-full w-full [&_svg]:size-6" />
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-label-lg text-on-surface">{service.name}</p>
                  <StatusPill on={service.is_visible} onLabel="Shown" offLabel="Hidden" />
                </div>
                <p className="line-clamp-1 text-sm text-on-surface-variant">{service.short_description}</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Quote button preselects: <strong>{quoteLabel(service.name) ?? "nothing (customer chooses)"}</strong>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <Switch checked={service.is_visible} onCheckedChange={(v) => toggleVisible(service, v)} aria-label={`Show ${service.name} on the website`} />
                  Show
                </label>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label={`Edit ${service.name}`}
                  onClick={() => {
                    setErrors({});
                    setDraft({
                      ...emptyDraft,
                      id: service.id,
                      name: service.name,
                      short_description: service.short_description,
                      full_description: service.full_description,
                      is_visible: service.is_visible,
                      image_path: service.image_path,
                    });
                  }}
                >
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon-lg" className="text-error hover:bg-error-container" onClick={() => setToDelete(service)} aria-label={`Delete ${service.name}`}>
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && !saving && closeEditor()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-headline-sm text-primary">{draft?.id ? "Edit Service" : "Add Service"}</DialogTitle>
            <DialogDescription>Fields marked * are required.</DialogDescription>
          </DialogHeader>
          {draft && (
            <form
              id="service-form"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="svc-name">Service name *</Label>
                <input id="svc-name" className={adminInputClass} maxLength={60} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-invalid={Boolean(errors.name)} aria-describedby="svc-name-error" />
                <FieldError id="svc-name-error" message={errors.name} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="svc-short">Short description *</Label>
                <input id="svc-short" className={adminInputClass} maxLength={200} value={draft.short_description} onChange={(e) => setDraft({ ...draft, short_description: e.target.value })} aria-invalid={Boolean(errors.short_description)} aria-describedby="svc-short-error" />
                <FieldError id="svc-short-error" message={errors.short_description} />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label htmlFor="svc-full">Full description *</Label>
                  <span className="text-xs text-on-surface-variant">{draft.full_description.length} / 1,500</span>
                </div>
                <textarea id="svc-full" rows={6} className={adminInputClass} maxLength={1500} value={draft.full_description} onChange={(e) => setDraft({ ...draft, full_description: e.target.value })} aria-invalid={Boolean(errors.full_description)} aria-describedby="svc-full-error" />
                <FieldError id="svc-full-error" message={errors.full_description} />
              </div>

              <div className="space-y-2">
                <span className="block text-sm font-medium">Image (optional)</span>
                {preview ? (
                  <div className="relative h-40 overflow-hidden rounded-lg bg-surface-container">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                    <img src={preview} alt="Selected service image" className="h-full w-full object-cover" />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2 h-9"
                      onClick={() => {
                        if (draft.newPreview) URL.revokeObjectURL(draft.newPreview);
                        setDraft({ ...draft, newFile: null, newPreview: null, removeImage: true });
                      }}
                    >
                      <X /> Remove image
                    </Button>
                  </div>
                ) : null}
                <label className="touch-target flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-low p-3 text-sm font-medium text-primary hover:bg-surface-container">
                  <ImagePlus className="size-5" aria-hidden />
                  {preview ? "Replace image" : "Choose an image"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pickImage(e.target.files?.[0])} />
                </label>
                <p className="text-xs text-on-surface-variant">JPEG, PNG, or WebP up to 10 MB. Large photos are made smaller automatically.</p>
                {progress !== null && <Progress value={progress} aria-label="Upload progress" />}
                <FieldError id="svc-image-error" message={errors.image} />
              </div>

              <label className="flex items-center gap-3 text-sm">
                <Switch checked={draft.is_visible} onCheckedChange={(v) => setDraft({ ...draft, is_visible: v })} />
                Show this service on the website
              </label>
            </form>
          )}
          <DialogFooter>
            <Button variant="outline" className="h-11 px-4" onClick={closeEditor} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="service-form" className="h-11 bg-primary-container px-4" disabled={saving}>
              {saving ? "Saving..." : "Save Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete ${toDelete?.name ?? "service"}?`}
        description="The service and its image will be removed. This cannot be undone. A service used by a portfolio project can't be deleted; hide it instead."
        onConfirm={async () => {
          if (toDelete) await remove(toDelete);
        }}
      />
    </>
  );
}
