"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteImage } from "@/components/site-image";
import { cn } from "@/lib/utils";

type Photo = { id: string; src: string; alt: string };

// Photo grid with an enlarged view, next/previous controls, keyboard arrows,
// and swipe on touch screens (PG-04).
export function PhotoGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const open = (i: number, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setIndex(i);
  };
  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (delta: number) => setIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (index !== null && !dialog.open) dialog.showModal();
    if (index === null && dialog.open) {
      dialog.close();
      triggerRef.current?.focus();
    }
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, step]);

  const current = index === null ? null : photos[index];

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, i) => (
          <li key={photo.id} className={cn(i === 0 && photos.length > 2 && "sm:col-span-2 sm:row-span-2")}>
            <button
              type="button"
              onClick={(e) => open(i, e.currentTarget)}
              className="group relative block aspect-[4/3] h-full w-full overflow-hidden rounded-xl bg-surface-container shadow-sm"
            >
              <SiteImage
                src={photo.src}
                alt={photo.alt}
                fill
                sizes={i === 0 ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute right-3 bottom-3 flex size-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur group-hover:bg-secondary">
                <ZoomIn className="size-5" aria-hidden />
              </span>
              <span className="sr-only">
                Enlarge photo {i + 1} of {photos.length}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={close}
        aria-label={`${title} photos`}
        className="m-0 h-full max-h-none w-full max-w-none bg-primary/95 p-0 text-on-primary backdrop:bg-black/60"
      >
        {current && (
          <div
            className="flex h-full flex-col"
            onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStart.current === null) return;
              const dx = e.changedTouches[0].clientX - touchStart.current;
              if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
              touchStart.current = null;
            }}
          >
            <div className="flex items-center justify-between px-4 py-4 sm:px-6">
              <span className="font-mono text-label-lg" aria-live="polite">
                Photo {index! + 1} of {photos.length}
              </span>
              <button
                type="button"
                onClick={close}
                className="touch-target flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/30"
                aria-label="Close enlarged photo"
              >
                <X className="size-6" />
              </button>
            </div>
            <div className="relative flex flex-1 items-center justify-between gap-2 px-2 sm:px-4">
              <button
                type="button"
                onClick={() => step(-1)}
                className="touch-target z-10 flex size-12 items-center justify-center rounded-full bg-primary-container/80 shadow-lg hover:bg-secondary"
                aria-label="Previous photo"
              >
                <ChevronLeft className="size-7" />
              </button>
              <div className="relative h-full max-h-[75vh] flex-1">
                <Image src={current.src} alt={current.alt} fill sizes="100vw" className="object-contain" />
              </div>
              <button
                type="button"
                onClick={() => step(1)}
                className="touch-target z-10 flex size-12 items-center justify-center rounded-full bg-primary-container/80 shadow-lg hover:bg-secondary"
                aria-label="Next photo"
              >
                <ChevronRight className="size-7" />
              </button>
            </div>
            <p className="px-6 py-4 text-center text-body-md text-primary-fixed-dim">{current.alt}</p>
          </div>
        )}
      </dialog>
    </>
  );
}
