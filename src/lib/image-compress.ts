"use client";

// Resizes and re-encodes photos in the browser before upload, so quote
// requests stay under Vercel's 4.5 MB request limit (QR-04, DC-07) and stored
// portfolio images stay small (DB-07). Output is always JPEG.

async function loadBitmap(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall back to <img> decoding below.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed"))),
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Scales `file` so its longest side is at most `maxDimension`, then lowers the
 * JPEG quality (and, if needed, the size) until it is at most `maxBytes`.
 * Throws if the image cannot be decoded or squeezed under the limit.
 */
export async function compressImage(
  file: Blob,
  { maxDimension, maxBytes }: { maxDimension: number; maxBytes: number },
): Promise<Blob> {
  const source = await loadBitmap(file);
  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height = "naturalHeight" in source ? source.naturalHeight : source.height;
  if (!width || !height) throw new Error("Image has no size");

  let scale = Math.min(1, maxDimension / Math.max(width, height));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  for (let attempt = 0; attempt < 6; attempt++) {
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    // White background so transparent PNGs don't turn black as JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.85, 0.75, 0.65, 0.55]) {
      const blob = await canvasToBlob(canvas, quality);
      if (blob.size <= maxBytes) {
        if ("close" in source) source.close();
        return blob;
      }
    }
    scale *= 0.8;
  }

  if ("close" in source) source.close();
  throw new Error("Could not compress image enough");
}
