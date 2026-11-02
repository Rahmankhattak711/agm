export interface GeneralLedgerQueryParams {
  from?: string | null;
  to?: string | null;
  accountId?: string | null;
  search?: string | null;
  journalId?: string | null;
  limit?: number;
}

export interface OffsetAccountDto {
  id: string;
  code: string;
  name: string;
}

export interface GeneralLedgerRowDto {
  id: string;
  journalEntryId: string;
  journalId: string;
  journalNumber: string;
  reference: string;
  source: string;
  sourceUrl: string;
  date: Date;
  rawEntry: any;
  account: {
    id: string;
    code: string;
    name: string;
    type: string;
  };
  offsetAccounts: OffsetAccountDto[];
  description: string;
  journalNotes: string;
  currency: string;
  debitAed: number;
  creditAed: number;
  projectName: string | null;
  contactName: string | null;
}

export interface ProfitLossQueryParams {
  from?: string | null;
  to?: string | null;
}

export interface TopEntryItemDto {
  lineId: string;
  journalEntryId: string;
  journalNumber: string;
  reference: string;
  date: string;
  description: string;
  source: string;
  sourceUrl: string;
  amount: number;
  isCredit: boolean;
  selectedLine: {
    accountId: string;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  };
  otherLines: Array<{
    id: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }>;
}

export interface ProfitLossAccountRowDto {
  id: string;
  code: string;
  name: string;
  type: string;
  subtype: string | null;
  monthly: Record<string, number>;
  total: number;
  topEntriesByMonth: Record<string, TopEntryItemDto[]>;
  topEntriesTotal: TopEntryItemDto[];
}

export interface ProfitLossCategoryDto {
  accounts: ProfitLossAccountRowDto[];
  totals: {
    monthly: Record<string, number>;
    total: number;
  };
}

export interface ProfitLossDto {
  monthKeys: string[];
  monthLabels: string[];
  income: ProfitLossCategoryDto;
  costOfSales: ProfitLossCategoryDto;
  grossProfit: {
    monthly: Record<string, number>;
    total: number;
  };
  operatingExpenses: ProfitLossCategoryDto;
  operatingProfit: {
    monthly: Record<string, number>;
    total: number;
  };
  otherIncome: ProfitLossCategoryDto;
  nonOperatingExpenses: ProfitLossCategoryDto;
  netProfit: {
    monthly: Record<string, number>;
    total: number;
  };
}
