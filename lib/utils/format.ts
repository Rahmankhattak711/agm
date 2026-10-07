export function formatNumber(val: number | string | undefined | null): string {
  const num = Number(val || 0);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatAed(val: number | string | undefined | null): string {
  return `AED ${formatNumber(val)}`;
}

export const formatCurrency = formatAed;

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toISOString().slice(0, 10);
}

export function formatDateGB(dateStr?: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB");
}
