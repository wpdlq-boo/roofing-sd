import "server-only";

import { Resend } from "resend";
import { quoteServiceOptions, site } from "@/config/site";
import { formatWinnipegDateTime } from "@/lib/format";
import type { QuoteFields } from "@/lib/validation";

// Sends one quote request to the admin (SRS 3.4.6 EmailNotifier). Nothing is
// logged or stored; the caller drops the data once this returns (QR-08).

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// No line breaks in anything that ends up in an email header (SEC-06).
function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export type QuotePhoto = { filename: string; content: Buffer };

export async function sendQuoteRequest(
  quote: QuoteFields,
  photos: QuotePhoto[],
  submittedAt: Date,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.QUOTE_ADMIN_EMAIL;
  const from = process.env.QUOTE_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    console.error("Quote email is not configured: set RESEND_API_KEY, QUOTE_ADMIN_EMAIL and QUOTE_FROM_EMAIL.");
    return false;
  }

  const serviceLabel = quoteServiceOptions.find((o) => o.value === quote.serviceType)?.label ?? quote.serviceType;
  const when = formatWinnipegDateTime(submittedAt);

  const rows: [string, string][] = [
    ["Full name", quote.fullName],
    ["Contact number", quote.contactNumber],
    ["Email address", quote.email],
    ["Type of service", serviceLabel],
    ["Project location", quote.projectLocation],
    ["Submitted", `${when} (Winnipeg time)`],
    ["Photos attached", String(photos.length)],
  ];

  // Escaped so customer text can't add links, scripts, or formatting (SEC-05).
  const html = `<!doctype html>
<html><body style="font-family:Arial,sans-serif;color:#191c1e;line-height:1.5">
  <h2 style="color:#0f2642;margin:0 0 16px">New quote request</h2>
  <table cellpadding="6" style="border-collapse:collapse">
    ${rows
      .map(
        ([label, value]) =>
          `<tr><td style="font-weight:bold;vertical-align:top;padding-right:16px">${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`,
      )
      .join("\n    ")}
  </table>
  <h3 style="color:#0f2642;margin:24px 0 8px">Project description</h3>
  <p style="white-space:pre-wrap;margin:0">${escapeHtml(quote.projectDescription)}</p>
  <p style="margin-top:24px;color:#44474d;font-size:13px">Reply to this email to answer the customer directly.</p>
</body></html>`;

  const text = [
    "New quote request",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Project description:",
    quote.projectDescription,
    "",
    "Reply to this email to answer the customer directly.",
  ].join("\n");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `${site.shortName} Website <${headerSafe(from)}>`,
    to: [to],
    replyTo: headerSafe(quote.email), // CI-04
    subject: headerSafe(`New Quote Request – ${serviceLabel} – ${quote.fullName}`), // CI-06
    html, // CI-05
    text,
    attachments: photos.map((p) => ({ filename: p.filename, content: p.content })),
  });

  if (error) {
    // Log the error type only, never the customer's data (QR-08).
    console.error("Resend rejected a quote email:", error.name);
    return false;
  }
  return true;
}
