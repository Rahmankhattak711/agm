import prisma from "@/lib/prisma";
import { OffsetResolverService } from "@/lib/services/accounting/offset-resolver.service";
import { microCache } from "../cache/micro-cache";
import { GeneralLedgerQueryParams, GeneralLedgerRowDto } from "./types";

function parseSafeDate(dStr: string | null | undefined, isEnd: boolean): Date | null {
  if (!dStr) return null;
  const clean = dStr.trim();
  let isoStr = clean;

  if (/^\d{4}-\d{2}$/.test(clean)) {
    if (isEnd) {
      const [y, m] = clean.split("-").map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      isoStr = `${clean}-${lastDay.toString().padStart(2, "0")}T23:59:59.999Z`;
    } else {
      isoStr = `${clean}-01T00:00:00.000Z`;
    }
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    isoStr = isEnd ? `${clean}T23:59:59.999Z` : `${clean}T00:00:00.000Z`;
  } else if (!clean.includes("T")) {
    isoStr = isEnd ? `${clean.slice(0, 10)}T23:59:59.999Z` : `${clean.slice(0, 10)}T00:00:00.000Z`;
  }

  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? null : d;
}

export class GetGeneralLedgerQueryHandler {
  static async execute(params: GeneralLedgerQueryParams): Promise<GeneralLedgerRowDto[]> {
    const cacheKey = `gl:${params.journalId || "all"}:${params.accountId || "all"}:${params.from || ""}:${params.to || ""}:${params.search || ""}`;
    const cached = microCache.get<GeneralLedgerRowDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const { from, to, accountId, search, journalId, limit = 250 } = params;

    const whereEntry: any = {
      isPosted: true,
    };

    // Filter by specific Journal ID (e.g., from invoice drill-down or # Journal ID is <ID> pill)
    if (journalId) {
      const jId = journalId.trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jId);
      whereEntry.OR = [
        ...(isUuid ? [{ id: jId }] : []),
        { entryNumber: { contains: jId, mode: "insensitive" } },
        { reference: { contains: jId, mode: "insensitive" } },
        { description: { contains: jId, mode: "insensitive" } },
      ];
    } else if (search) {
      const s = search.trim();
      whereEntry.OR = [
        { entryNumber: { contains: s, mode: "insensitive" } },
        { reference: { contains: s, mode: "insensitive" } },
        { description: { contains: s, mode: "insensitive" } },
        { lines: { some: { description: { contains: s, mode: "insensitive" } } } },
      ];
    }

    // Scoped date range utilizing DB composite index [isPosted, entryDate]
    if ((from || to) && !journalId) {
      const fromDate = parseSafeDate(from, false);
      const toDate = parseSafeDate(to, true);
      if (fromDate || toDate) {
        whereEntry.entryDate = {};
        if (fromDate) whereEntry.entryDate.gte = fromDate;
        if (toDate) whereEntry.entryDate.lte = toDate;
      }
    }

    // Scoped account filter at DB level
    if (accountId && !journalId) {
      whereEntry.lines = {
        some: {
          OR: [
            { accountId },
            { account: { accountCode: accountId } },
          ],
        },
      };
    }

    // Fetch matching journal entries with indexed lookup
    const journalEntries = await prisma.journalEntry.findMany({
      where: whereEntry,
      orderBy: { entryDate: "desc" },
      include: {
        lines: {
          include: {
            account: true,
            project: true,
          },
        },
      },
      take: limit,
    });

    const glRecords: GeneralLedgerRowDto[] = [];

    for (const entry of journalEntries) {
      const linesForOffset = entry.lines.map((l: any) => ({
        id: l.id,
        accountId: l.accountId,
        account: {
          id: l.account.id,
          code: l.account.accountCode,
          name: l.account.accountName,
        },
        debit: Number(l.debit),
        credit: Number(l.credit),
      }));

      for (const line of entry.lines as any[]) {
        if (
          !journalId &&
          accountId &&
          line.accountId !== accountId &&
          line.account?.accountCode !== accountId
        ) {
          continue;
        }

        if (!journalId && search) {
          const s = search.toLowerCase();
          const matchLine = line.description?.toLowerCase().includes(s);
          const matchRef = entry.reference?.toLowerCase().includes(s);
          const matchDesc = entry.description?.toLowerCase().includes(s);
          if (!matchLine && !matchRef && !matchDesc) {
            continue;
          }
        }

        const targetLike = {
          id: line.id,
          accountId: line.accountId,
          account: {
            id: line.account.id,
            code: line.account.accountCode,
            name: line.account.accountName,
          },
          debit: Number(line.debit),
          credit: Number(line.credit),
        };

        const offsets = OffsetResolverService.resolveOffsets(targetLike, linesForOffset);

        // Detect Source Badge and clean redirect URL
        let source = "Manual journal";
        let sourceUrl = `/finance/journal-entries?search=${encodeURIComponent(entry.entryNumber || "")}`;
        const num = entry.entryNumber || "";
        const ref = entry.reference || "";

        if (num.startsWith("JE-INV-")) {
          source = "Sales invoice";
          const invMatch = ref.match(/INV-(?:\d{4}-)?\d+/i) || num.match(/INV-(?:\d{4}-)?\d+/i);
          const invoiceNum = invMatch ? invMatch[0] : (ref || num);
          sourceUrl = `/commercial/sales-invoices/${encodeURIComponent(invoiceNum)}`;
        } else if (num.startsWith("JE-REC-")) {
          source = "Customer payment";
          sourceUrl = `/commercial/sales-invoices?search=${encodeURIComponent(ref || num)}`;
        } else if (num.startsWith("JE-BILL-")) {
          source = "Bill";
          sourceUrl = `/commercial/supplier-bills?search=${encodeURIComponent(ref || num)}`;
        } else if (num.startsWith("JE-PAY-")) {
          source = "Bill payment";
          sourceUrl = `/commercial/supplier-bills?search=${encodeURIComponent(ref || num)}`;
        } else if (num.startsWith("JE-CN-")) {
          source = "Credit note";
          sourceUrl = `/commercial/sales-invoices?search=${encodeURIComponent(ref || num)}`;
        } else if (num.startsWith("JE-DN-")) {
          source = "Debit note";
          sourceUrl = `/commercial/supplier-bills?search=${encodeURIComponent(ref || num)}`;
        }

        glRecords.push({
          id: line.id,
          journalEntryId: entry.id,
          journalId: entry.entryNumber || entry.id.slice(0, 8),
          journalNumber: entry.entryNumber,
          reference: entry.reference || "—",
          source,
          sourceUrl,
          date: entry.entryDate,
          rawEntry: {
            id: entry.id,
            entryNumber: entry.entryNumber,
            entryDate: entry.entryDate,
            reference: entry.reference,
            description: entry.description,
            isPosted: entry.isPosted,
            sourceDocumentType: source,
            lines: entry.lines,
          },
          account: {
            id: line.account.id,
            code: line.account.accountCode,
            name: line.account.accountName,
            type: line.account.type,
          },
          offsetAccounts: offsets,
          description: line.description || "—",
          journalNotes: entry.description || "—",
          currency: line.currency || "AED",
          debitAed: Number(line.debitAed) || Number(line.debit),
          creditAed: Number(line.creditAed) || Number(line.credit),
          projectName: line.project?.name || null,
          contactName: line.contactName || null,
        });
      }
    }

    // Cache results for 45 seconds for sub-5ms repeat transitions
    microCache.set(cacheKey, glRecords, 45);

    return glRecords;
  }
}
