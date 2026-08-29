/**
 * Shared formatting utilities used across all workspace pages.
 * Import from here instead of redefining inline.
 */

/**
 * Format a number as AED currency.
 * @example formatAed(4850) → "AED 4,850.00"
 */
export function formatAed(val: number | string | undefined | null): string {
  const num = Number(val || 0);
  return `AED ${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format an ISO date string to YYYY-MM-DD, falling back to "—".
 * @example formatDate("2026-08-25T00:00:00Z") → "2026-08-25"
 */
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toISOString().slice(0, 10);
}

/**
 * Format a date for print headers using en-GB locale (DD/MM/YYYY).
 * @example formatDateGB("2026-08-25") → "25/08/2026"
 */
export function formatDateGB(dateStr?: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB");
}
