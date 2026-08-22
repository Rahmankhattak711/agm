import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { Product } from "@/lib/hooks/api-hooks";
import { Plus, Trash2 } from "lucide-react";
import React, { ChangeEvent } from "react";
import { formatCurrency, QuotationItem } from "./constants";

export interface QuotationItemsTableProps {
  items: QuotationItem[];
  availableProducts?: Product[];
  onProductSelect: (id: number | string, productId: string) => void;
  onUpdateItem: (
    id: number | string,
    key: keyof Omit<QuotationItem, "id">,
    val: any,
  ) => void;
  onAddItem: (sectionName?: string) => void;
  onRemoveItem: (id: number | string) => void;
  calculateRowTotal: (item: QuotationItem) => number;
}

export const QuotationItemsTable: React.FC<QuotationItemsTableProps> = ({
  items,
  availableProducts = [],
  onProductSelect,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  calculateRowTotal,
}) => {
  const cellInputClass =
    "w-full bg-transparent outline-none focus:bg-emerald-50/70 rounded px-1 py-0.5 transition-colors print:bg-transparent print:p-0";

  return (
    <div className="px-10 mt-4">
      <Table
        className="w-full text-[12px] border-collapse border border-agm-box-border bg-white rounded-lg overflow-hidden shadow-xs"
        wrapperClassName="overflow-visible"
      >
        <thead>
          <tr className="text-white bg-agm-green">
            <TableHeaderCell
              align="center"
              className="py-2.5 px-2 font-bold w-10 border border-agm-box-border text-white"
            >
              #
            </TableHeaderCell>
            <TableHeaderCell
              align="left"
              className="py-2.5 px-3 font-bold border border-agm-box-border text-white"
            >
              DISC
            </TableHeaderCell>
            <TableHeaderCell
              align="center"
              className="py-2.5 px-2 font-bold w-20 border border-agm-box-border text-white"
            >
              QTY/SQM
            </TableHeaderCell>
            <TableHeaderCell
              align="right"
              className="py-2.5 px-3 font-bold w-28 border border-agm-box-border text-white"
            >
              Price
            </TableHeaderCell>
            <TableHeaderCell
              align="right"
              className="py-2.5 px-3 font-bold w-32 border border-agm-box-border text-white"
            >
              Total
            </TableHeaderCell>
            <TableHeaderCell
              align="center"
              className="py-2.5 print:hidden font-bold w-10 border border-agm-box-border text-white"
            >
              Actions
            </TableHeaderCell>
          </tr>
        </thead>
        <TableBody className="divide-y divide-agm-box-border">
          {items.map((it, idx) => {
            const isFree = Boolean(
              it.isFree ||
              String(it.qty).toLowerCase() === "free" ||
              String(it.rate).toLowerCase() === "free",
            );
            const rowTotal = calculateRowTotal(it);
            const prevSection = idx > 0 ? items[idx - 1].section : null;
            const showSectionHeader = it.section && it.section !== prevSection;

            return (
              <React.Fragment key={it.id}>
                {showSectionHeader && (
                  <TableRow className="bg-agm-box-bg font-bold border-t border-b border-agm-box-border print-avoid-break hover:bg-agm-box-bg">
                    <TableCell
                      colSpan={5}
                      className="py-1.5 px-3 text-[12px] font-bold text-agm-green uppercase tracking-wide border border-agm-box-border"
                    >
                      {it.section}
                    </TableCell>
                    <td className="print:hidden border-none bg-white"></td>
                  </TableRow>
                )}

                <TableRow
                  className={`print-avoid-break hover:bg-slate-50/50 ${
                    idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"
                  }`}
                >
                  <TableCell
                    align="center"
                    className="py-2 px-2 align-top text-slate-700 font-bold border border-agm-box-border"
                  >
                    {idx + 1}
                  </TableCell>

                  <TableCell className="py-2 px-2 align-top border border-agm-box-border">
                    {availableProducts.length > 0 && (
                      <div className="mb-1 print:hidden">
                        <select
                          className="w-full text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                          value={it.productId || ""}
                          onChange={(e) =>
                            onProductSelect(it.id, e.target.value)
                          }
                        >
                          <option value="">
                            -- Choose from Catalog (Auto-fill) --
                          </option>
                          {availableProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku}) - AED{" "}
                              {Number(p.sellingPrice || p.costPrice).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="print:hidden flex items-center gap-1 mb-1">
                      <span className="text-[10px] text-slate-400 font-bold">
                        Section:
                      </span>
                      <input
                        className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700 w-40 font-semibold"
                        placeholder="e.g. Garage Work, Kitchen..."
                        value={it.section || ""}
                        onChange={(e) =>
                          onUpdateItem(it.id, "section", e.target.value)
                        }
                      />
                    </div>

                    <div className="hidden print:block whitespace-pre-wrap text-slate-800 text-[11.5px] leading-relaxed">
                      {it.desc}
                    </div>

                    <textarea
                      rows={Math.max(
                        2,
                        (it.desc.match(/\n/g) || []).length + 2,
                      )}
                      placeholder="Enter scope of work, specifications, or select a product above..."
                      className={
                        cellInputClass +
                        " print:hidden resize-y min-h-[46px] text-slate-800 leading-snug"
                      }
                      value={it.desc}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        onUpdateItem(it.id, "desc", e.target.value)
                      }
                    />
                  </TableCell>

                  <TableCell
                    align="center"
                    className="py-2 px-2 align-top border border-agm-box-border"
                  >
                    <input
                      type="text"
                      className={cellInputClass + " text-center font-bold"}
                      value={it.qty}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onUpdateItem(it.id, "qty", e.target.value)
                      }
                      placeholder="1"
                    />
                  </TableCell>

                  <TableCell
                    align="right"
                    className="py-2 px-2 align-top border border-agm-box-border"
                  >
                    <input
                      type="text"
                      placeholder="0.00"
                      className={
                        cellInputClass + " text-right font-mono font-semibold"
                      }
                      value={
                        isFree
                          ? "Free"
                          : typeof it.rate === "number"
                            ? it.rate.toLocaleString("en-AE")
                            : it.rate
                      }
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onUpdateItem(it.id, "rate", e.target.value)
                      }
                    />
                  </TableCell>

                  <TableCell
                    align="right"
                    className="py-2 px-3 align-top font-mono font-bold text-slate-900 border border-agm-box-border"
                  >
                    {isFree ? "Free" : formatCurrency(rowTotal)}
                  </TableCell>

                  <td className="py-2 px-1 align-top text-center print:hidden border-none">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(it.id)}
                      className="p-1 text-slate-400 hover:text-red-500"
                      title="Remove row"
                      icon={<Trash2 size={14} />}
                    />
                  </td>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex items-center gap-3 mt-2.5 print:hidden">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onAddItem()}
          icon={<Plus size={14} />}
          className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200 text-[11px]"
        >
          Add Line Item
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onAddItem("New Section")}
          icon={<Plus size={14} />}
          className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 text-[11px]"
        >
          Add Line with Section Header
        </Button>
      </div>
    </div>
  );
};

export default QuotationItemsTable;
