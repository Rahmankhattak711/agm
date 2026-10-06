import type { BadgeTone } from "@/components/ui/Badge";

export interface StatusConfig {
  label: string;
  tone: BadgeTone;
}

const make =
  (map: Record<string, StatusConfig>, fallback: StatusConfig) =>
  (status?: string | null): StatusConfig =>
    (status && map[status]) || fallback;

export const getInvoiceStatus = make(
  {
    PAID: { label: "Paid", tone: "emerald" },
    POSTED: { label: "Posted", tone: "sky" },
    PARTIALLY_PAID: { label: "Partial", tone: "amber" },
  },
  { label: "Draft", tone: "slate" },
);

export const getQuotationStatus = make(
  {
    ACCEPTED: { label: "Accepted", tone: "emerald" },
    REJECTED: { label: "Declined", tone: "rose" },
    SENT: { label: "Sent", tone: "sky" },
  },
  { label: "Draft", tone: "slate" },
);
