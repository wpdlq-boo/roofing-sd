// "2024-08-01" -> "August 2024". Dates are stored as the first of the month.
export function formatMonthYear(date: string | null): string | null {
  if (!date) return null;
  const [year, month] = date.split("-").map(Number);
  if (!year || !month) return null;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-CA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Timestamps are stored in UTC and shown in Winnipeg time (DB-05, QR-07).
export function formatWinnipegDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-CA", {
    timeZone: "America/Winnipeg",
    dateStyle: "long",
    timeStyle: "short",
  });
}
