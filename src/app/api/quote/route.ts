import { NextResponse } from "next/server";
import { sendQuoteRequest, type QuotePhoto } from "@/lib/email";
import { fieldErrors, quotePhotoRules, quoteSchema } from "@/lib/validation";

// Quote form handler (SRS 3.2.5, UC-03). Everything stays in memory for the
// length of this request and is never written anywhere (QR-08, INV-01).

const MIN_FILL_TIME_MS = 3000; // QR-06

// Checks the file's first bytes, not its name (QR-05).
function detectImageType(bytes: Uint8Array): "jpeg" | "png" | "webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  )
    return "png";
  if (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "webp";
  return null;
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const submittedAt = new Date();

  // Spam checks: hidden field filled in, or sent too quickly (QR-06). The
  // customer-facing response looks like success so bots learn nothing (UC-03 6a).
  const honeypot = String(form.get("website") ?? "");
  const elapsed = Number(form.get("elapsedMs") ?? 0);
  if (honeypot.trim() !== "" || !Number.isFinite(elapsed) || elapsed < MIN_FILL_TIME_MS) {
    return NextResponse.json({ ok: true });
  }

  const parsed = quoteSchema.safeParse({
    fullName: form.get("fullName") ?? "",
    contactNumber: form.get("contactNumber") ?? "",
    email: form.get("email") ?? "",
    serviceType: form.get("serviceType") ?? "",
    projectLocation: form.get("projectLocation") ?? "",
    projectDescription: form.get("projectDescription") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: fieldErrors(parsed.error) }, { status: 400 });
  }

  const files = form.getAll("photos").filter((v): v is File => v instanceof File && v.size > 0);
  if (files.length > quotePhotoRules.maxCount) {
    return NextResponse.json({ ok: false, errors: { photos: "You can upload up to 5 photos." } }, { status: 400 });
  }
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > quotePhotoRules.maxTotalBytes) {
    return NextResponse.json(
      { ok: false, errors: { photos: "Your photos are too large together. Please remove one and try again." } },
      { status: 400 },
    );
  }

  const photos: QuotePhoto[] = [];
  for (const [i, file] of files.entries()) {
    const content = Buffer.from(await file.arrayBuffer());
    const type = detectImageType(content.subarray(0, 12));
    if (!type) {
      return NextResponse.json(
        { ok: false, errors: { photos: "Only JPEG, PNG, or WebP photos can be uploaded." } },
        { status: 400 },
      );
    }
    const ext = type === "jpeg" ? "jpg" : type;
    photos.push({ filename: `quote-photo-${i + 1}.${ext}`, content }); // QR-07
  }

  const sent = await sendQuoteRequest(parsed.data, photos, submittedAt);
  if (!sent) {
    // No confirmation unless the email service accepted it (REL-02).
    return NextResponse.json({ ok: false, error: "Email could not be sent." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
