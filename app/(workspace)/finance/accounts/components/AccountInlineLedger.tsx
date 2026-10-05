"use client";

import { useAccountLedger, ChartOfAccount } from "@/lib/hooks/api-hooks";

interface AccountInlineLedgerProps {
  accountId: string;
  account: ChartOfAccount;
  formatNumber: (val: number | string | undefined) => string;
  formatCurrency: (val: number | string | undefined) => string;
  onClose: () => void;
}

export function AccountInlineLedger({
  accountId,
  account,
  formatNumber,
  formatCurrency,
  onClose,
}: AccountInlineLedgerProps) {
  const { data, isLoading } = useAccountLedger(accountId);

  return (
    <tr className="bg-slate-50/70 border-y border-slate-200/80">
      <td colSpan={6} className="p-3 sm:px-6">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                {account.accountCode}
              </span>
              <span className="font-extrabold text-xs text-slate-800">
                {account.accountName}
              </span>
              <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                ({account.type}) • General Ledger
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[9.5px] text-slate-400 font-bold uppercase mr-1.5">
                  Running Balance:
                </span>
                <span className="font-mono font-black text-xs text-emerald-800">
                  {formatCurrency(account.balance)}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-slate-400 hover:text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded hover:bg-slate-200/60 cursor-pointer transition-colors"
                title="Collapse Ledger"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Loading ledger transactions...
            </div>
          ) : !data?.ledger || data.ledger.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 italic">
              No journal transactions have been posted to this account yet.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Voucher / Ref</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">Debit (AED)</th>
                    <th className="py-2 px-3 text-right">Credit (AED)</th>
                    <th className="py-2 px-3 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/60">
                      <td className="font-mono text-xs text-slate-600 whitespace-nowrap py-1.5 px-3">
                        {new Date(entry.entryDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className="font-mono font-bold text-xs text-slate-800 whitespace-nowrap py-1.5 px-3">
                        {entry.entryNumber}
                        {entry.reference && (
                          <span className="block text-[9.5px] text-slate-400 font-normal">
                            Ref: {entry.reference}
                          </span>
                        )}
                      </td>
                      <td className="text-xs text-slate-700 max-w-xs truncate py-1.5 px-3">
                        {entry.description || "General Journal Entry"}
                      </td>
                      <td className="font-mono text-xs text-right text-slate-800 py-1.5 px-3 font-semibold">
                        {entry.debit > 0 ? formatNumber(entry.debit) : "—"}
                      </td>
                      <td className="font-mono text-xs text-right text-slate-800 py-1.5 px-3 font-semibold">
                        {entry.credit > 0 ? formatNumber(entry.credit) : "—"}
                      </td>
                      <td className="font-mono font-black text-xs text-right text-emerald-800 whitespace-nowrap py-1.5 px-3">
                        {formatNumber(entry.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data?.ledger && data.ledger.length > 0 && (
            <div className="px-3.5 py-1.5 bg-slate-50/80 border-t border-slate-200/80 text-[10.5px] text-slate-500 flex items-center justify-between">
              <span>
                Showing {data.ledger.length} chronological journal line postings
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Collapse
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
