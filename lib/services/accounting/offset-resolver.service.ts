export interface OffsetAccountBadge {
  id: string;
  code: string;
  name: string;
}

export interface JournalLineLike {
  id?: string;
  accountId: string;
  account?: {
    id: string;
    code: string;
    name: string;
  };
  debit: number;
  credit: number;
}

export class OffsetResolverService {
  /**
   * For any given line in a balanced journal entry, resolve its counter-balancing "offset" accounts.
   * If line is Debit, offset accounts are all lines with Credit > 0.
   * If line is Credit, offset accounts are all lines with Debit > 0.
   */
  static resolveOffsets(
    targetLine: JournalLineLike,
    allLines: JournalLineLike[]
  ): OffsetAccountBadge[] {
    const isTargetDebit = Number(targetLine.debit) > 0;
    const offsets: OffsetAccountBadge[] = [];
    const seen = new Set<string>();

    for (const line of allLines) {
      // Don't compare with itself
      if (line === targetLine) continue;

      const hasOppositeEffect = isTargetDebit
        ? Number(line.credit) > 0
        : Number(line.debit) > 0;

      if (hasOppositeEffect && line.account) {
        if (!seen.has(line.account.id)) {
          seen.add(line.account.id);
          offsets.push({
            id: line.account.id,
            code: line.account.code,
            name: line.account.name,
          });
        }
      }
    }

    return offsets;
  }
}
