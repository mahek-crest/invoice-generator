/** Display helpers. Kept apart from lib/totals.ts so the maths needs no locale. */

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const longDate = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}

/** Cents to a bare editable number, e.g. 1250 -> "12.50". */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Formats a YYYY-MM-DD string. Built from parts rather than passed to the Date
 * parser, which reads a bare date as UTC and can show the previous day west of
 * Greenwich.
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return "";
  const date = new Date(year, month - 1, day);
  return Number.isFinite(date.getTime()) ? longDate.format(date) : "";
}
