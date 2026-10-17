"use client";

import { CircleAlert, CircleCheck, ImagePlus, Info, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { quoteServiceOptions, site } from "@/config/site";
import { compressImage } from "@/lib/image-compress";
import { fieldErrors, quotePhotoRules, quoteSchema, type QuoteFields } from "@/lib/validation";
import { cn } from "@/lib/utils";

function withoutKey(record: Record<string, string>, key: string) {
  const next = { ...record };
  delete next[key];
  return next;
}

type Photo = { id: string; file: File; previewUrl: string };

const emptyFields: QuoteFields = {
  fullName: "",
  contactNumber: "",
  email: "",
  serviceType: "",
  projectLocation: "",
  projectDescription: "",
};

const inputClass =
  "min-h-[44px] w-full rounded-lg bg-surface-container-low px-4 py-3 text-body-md text-on-surface shadow-sm transition-all placeholder:text-on-surface-variant/70 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none aria-invalid:ring-2 aria-invalid:ring-error";

function Field({
  id,
  label,
  error,
  hint,
  required = true,
  children,
  aside,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        {/* Visible label; required fields marked with an asterisk (UI-07). */}
        <label htmlFor={id} className="block text-label-lg text-primary">
          {label} {required && <span className="text-error" aria-hidden>*</span>}
          {required && <span className="sr-only">(required)</span>}
        </label>
        {aside}
      </div>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-on-surface-variant">
          {hint}
        </p>
      )}
      {/* Error next to the field, in plain language (UI-08). */}
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-1 text-sm text-error">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

export function QuoteForm({ initialService }: { initialService: string }) {
  const [fields, setFields] = useState<QuoteFields>({ ...emptyFields, serviceType: initialService });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const loadedAt = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Start the spam timer when the form appears (QR-06).
  useEffect(() => {
    loadedAt.current = Date.now();
  }, []);

  // Release thumbnail URLs when the page unmounts.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)), []);

  const update = (key: keyof QuoteFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((errs) => withoutKey(errs, key));
  };

  const describedBy = (id: string, hasHint = false) =>
    [hasHint && `${id}-hint`, errors[id] && `${id}-error`].filter(Boolean).join(" ") || undefined;

  // Checks each photo as it is added (SRS 3.2.5.5).
  function addPhotos(files: FileList | null) {
    if (!files) return;
    setPhotoError(null);
    const next = [...photos];
    for (const file of Array.from(files)) {
      if (!quotePhotoRules.acceptedTypes.includes(file.type as never)) {
        setPhotoError("Only JPEG, PNG, or WebP photos can be uploaded.");
        continue;
      }
      if (file.size > quotePhotoRules.maxBytesEach) {
        setPhotoError("This photo is too large. Please choose a photo under 10 MB.");
        continue;
      }
      if (next.length >= quotePhotoRules.maxCount) {
        setPhotoError("You can upload up to 5 photos.");
        break;
      }
      next.push({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file) });
    }
    setPhotos(next);
    if (fileInput.current) fileInput.current.value = "";
  }

  function removePhoto(id: string) {
    setPhotos((list) => {
      const photo = list.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return list.filter((p) => p.id !== id);
    });
    setPhotoError(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const parsed = quoteSchema.safeParse(fields);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      // Move focus to the first invalid field.
      const first = Object.keys(emptyFields).find((k) => errs[k]);
      if (first) formRef.current?.querySelector<HTMLElement>(`#${first}`)?.focus();
      return;
    }

    setStatus("sending"); // UI-09

    // Resize to 1,600 px and keep the total at 4 MB or less (QR-04).
    const perPhotoBudget = Math.floor(quotePhotoRules.maxTotalBytes / Math.max(photos.length, 1));
    const compressed: Blob[] = [];
    for (const photo of photos) {
      try {
        compressed.push(
          await compressImage(photo.file, { maxDimension: quotePhotoRules.maxDimension, maxBytes: perPhotoBudget }),
        );
      } catch {
        setStatus("idle");
        setPhotoError(
          `"${photo.file.name}": This photo could not be processed. Please choose a different photo.`,
        );
        return;
      }
    }

    const body = new FormData();
    for (const [key, value] of Object.entries(parsed.data)) body.append(key, value);
    body.append("website", (formRef.current?.elements.namedItem("website") as HTMLInputElement)?.value ?? "");
    body.append("elapsedMs", String(Date.now() - loadedAt.current));
    compressed.forEach((blob, i) => body.append("photos", blob, `quote-photo-${i + 1}.jpg`));

    try {
      const res = await fetch("/api/quote", { method: "POST", body });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: Record<string, string>; error?: string };
      if (res.ok && json.ok) {
        photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        setStatus("sent");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (res.status === 400 && json.errors) {
        setErrors(json.errors);
        if (json.errors.photos) setPhotoError(json.errors.photos);
        setStatus("idle");
        return;
      }
      throw new Error(json.error ?? "Send failed");
    } catch {
      // Entries and photos stay in place (SRS 3.2.5.5, REL-02).
      setStatus("failed");
      setFormError(`Sorry, your request could not be sent. Please try again, or call us at ${site.phone.display}.`);
    }
  }

  if (status === "sent") {
    // Confirmation, shown only after the email service accepted it (3.2.5.4, REL-02).
    return (
      <section
        role="status"
        className="space-y-6 rounded-2xl bg-surface-container-lowest p-8 text-center shadow-sm sm:p-12"
      >
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-surface-container-high">
          <CircleCheck className="size-9 text-secondary" aria-hidden />
        </span>
        <h2 className="text-headline-xl text-primary">We have received your email.</h2>
        <p className="mx-auto max-w-lg text-body-lg text-on-surface-variant">
          Thank you for your request. We&apos;ll review your project details and get back to you by email or
          phone.
        </p>
        <p className="text-body-md text-on-surface-variant">
          Need to reach us sooner? Call{" "}
          <a href={site.phone.href} className="font-bold text-secondary">
            {site.phone.display}
          </a>
          .
        </p>
      </section>
    );
  }

  const sending = status === "sending";

  return (
    <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm sm:p-8 lg:p-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-2 border-b border-surface-container-highest pb-6">
        <h2 className="text-headline-lg text-primary">Project Details</h2>
        <p className="text-sm text-on-surface-variant">
          <span className="font-bold text-error">*</span> Required field
        </p>
      </div>

      {formError && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl bg-error-container p-4 text-on-error-container">
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-body-md">{formError}</p>
        </div>
      )}

      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
        {/* Hidden from people; bots that fill it in are discarded (QR-06). */}
        <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
          <label htmlFor="website">Leave this field empty</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field id="fullName" label="Full Name" error={errors.fullName}>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              maxLength={100}
              value={fields.fullName}
              onChange={update("fullName")}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={describedBy("fullName")}
              className={inputClass}
            />
          </Field>
          <Field id="contactNumber" label="Contact Number" error={errors.contactNumber} hint="10-digit phone number, e.g. 204-555-0198.">
            <input
              id="contactNumber"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={fields.contactNumber}
              onChange={update("contactNumber")}
              aria-invalid={Boolean(errors.contactNumber)}
              aria-describedby={describedBy("contactNumber", true)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field id="email" label="Email Address" error={errors.email}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={fields.email}
              onChange={update("email")}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy("email")}
              className={inputClass}
            />
          </Field>
          <Field id="serviceType" label="Type of Service" error={errors.serviceType}>
            <select
              id="serviceType"
              value={fields.serviceType}
              onChange={update("serviceType")}
              aria-invalid={Boolean(errors.serviceType)}
              aria-describedby={describedBy("serviceType")}
              className={cn(inputClass, "cursor-pointer")}
            >
              <option value="" disabled>
                Select a service
              </option>
              {quoteServiceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          id="projectLocation"
          label="Project Location"
          error={errors.projectLocation}
          hint="Neighbourhood, street, or town is enough for a first estimate."
        >
          <input
            id="projectLocation"
            type="text"
            autoComplete="street-address"
            maxLength={200}
            value={fields.projectLocation}
            onChange={update("projectLocation")}
            aria-invalid={Boolean(errors.projectLocation)}
            aria-describedby={describedBy("projectLocation", true)}
            className={inputClass}
          />
        </Field>

        <Field
          id="projectDescription"
          label="Project Description"
          error={errors.projectDescription}
          aside={
            <span className="text-sm text-on-surface-variant" aria-live="polite">
              {fields.projectDescription.length} / 2,000
            </span>
          }
        >
          <textarea
            id="projectDescription"
            rows={5}
            maxLength={2000}
            value={fields.projectDescription}
            onChange={update("projectDescription")}
            placeholder="What needs to be done? Mention any leaks, damage, or the size of the job."
            aria-invalid={Boolean(errors.projectDescription)}
            aria-describedby={describedBy("projectDescription")}
            className={cn(inputClass, "resize-y")}
          />
        </Field>

        {/* Photos (QR-03, HW-02) */}
        <div className="space-y-3">
          <div>
            <span id="photos-label" className="block text-label-lg text-primary">
              Photos <span className="text-sm font-normal text-on-surface-variant">(optional)</span>
            </span>
            <p id="photos-hint" className="text-sm text-on-surface-variant">
              Up to 5 photos, JPEG, PNG, or WebP, each under 10 MB.
            </p>
          </div>
          <label
            htmlFor="photos"
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low p-6 text-center transition-colors hover:bg-surface-container",
              photos.length >= quotePhotoRules.maxCount && "pointer-events-none opacity-50",
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
              <ImagePlus className="size-6" aria-hidden />
            </span>
            <span className="text-label-lg text-primary">
              <span className="text-secondary underline underline-offset-2">Choose photos</span> or take
              a picture
            </span>
            <input
              ref={fileInput}
              id="photos"
              type="file"
              accept={quotePhotoRules.acceptedTypes.join(",")}
              multiple
              disabled={photos.length >= quotePhotoRules.maxCount || sending}
              onChange={(e) => addPhotos(e.target.files)}
              aria-describedby={["photos-hint", photoError && "photos-error"].filter(Boolean).join(" ")}
              className="sr-only"
            />
          </label>
          {photoError && (
            <p id="photos-error" role="alert" className="flex items-start gap-1 text-sm text-error">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {photoError}
            </p>
          )}
          {photos.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {photos.map((photo, i) => (
                <li key={photo.id} className="relative aspect-square overflow-hidden rounded-lg bg-surface-container shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                  <img src={photo.previewUrl} alt={`Selected photo ${i + 1}: ${photo.file.name}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    disabled={sending}
                    className="touch-target absolute top-1 right-1 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-error"
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    <X className="size-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col items-center justify-end gap-4 border-t border-surface-container-highest pt-6 sm:flex-row">
          <button
            type="submit"
            disabled={sending}
            className="touch-target flex w-full items-center justify-center gap-2 rounded-lg bg-secondary-container px-8 py-3.5 text-label-lg text-on-secondary-container shadow-md transition-all hover:bg-secondary-fixed disabled:cursor-not-allowed disabled:opacity-80 sm:w-auto"
          >
            {sending ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-on-secondary-container border-t-transparent" aria-hidden />
                Sending...
              </>
            ) : (
              <>
                Submit Quote Request
                <Send className="size-5" aria-hidden />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 flex items-start gap-3 rounded-xl bg-surface-container-low p-5">
        <Info className="mt-0.5 size-5 shrink-0 text-secondary" aria-hidden />
        <p className="text-sm text-on-surface-variant">
          <strong className="text-primary">Privacy notice:</strong> We collect your name, contact number,
          email address, project location, project description, and any photos only to prepare your
          quote and contact you. Your request is sent to us by email only and is not stored on this
          website. See our{" "}
          <a href="/privacy" className="font-semibold text-secondary underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </section>
  );
}
