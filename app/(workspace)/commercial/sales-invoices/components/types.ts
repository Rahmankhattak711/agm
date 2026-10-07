export { formatNumber } from "@/lib/utils/format";
export function parseDescriptionPoints(desc: string): string[] {
  if (!desc) return [];
  const normalized = String(desc).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const parts = normalized
    .split(/(?:\n+|(?<=\S)\s+(?=\d+[\.\)]\s+)|(?<=\S)\s+(?=[•\-*]\s+))/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [desc];
}
