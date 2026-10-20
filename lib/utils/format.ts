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

export function formatPdfDocumentTitle(
  parts: (string | undefined | null)[],
  fallback: string = "AGM-Document",
): string {
  const cleanedParts = parts
    .map((p) => (p || "").trim())
    .filter((p) => p.length > 0)
    .map((p) =>
      p
        .replace(/[\\/:*?"<>|]+/g, "-")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((p) => p.length > 0);

  if (cleanedParts.length === 0) {
    return fallback;
  }
  return cleanedParts.join(" - ");
}

export function printWithDocumentTitle(title: string): void {
  if (typeof window === "undefined") return;
  const originalTitle = document.title;
  if (title && title.trim()) {
    document.title = title.trim();
  }
  window.print();
  const resetTitle = () => {
    document.title = originalTitle;
    window.removeEventListener("afterprint", resetTitle);
  };
  window.addEventListener("afterprint", resetTitle);
  setTimeout(resetTitle, 3000);
}
