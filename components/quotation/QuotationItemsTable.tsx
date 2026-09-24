import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { Product } from "@/lib/hooks/api-hooks";
import { ListPlus, Plus, Trash2, X } from "lucide-react";
import React, { ChangeEvent } from "react";
import { extractSubItems, formatCurrency, QuotationItem } from "./constants";

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
    "w-full bg-transparent outline-none focus:bg-emerald-50/70 rounded px-1.5 py-0.5 transition-colors print:bg-transparent print:p-0 print:text-[12.5px] print:text-slate-900";

  const getItemPoints = (it: QuotationItem): string[] => {
    if (it.points && it.points.length > 0) return it.points;
    const extracted = extractSubItems(it.desc);
    return extracted.length > 0 ? extracted : [""];
  };

  const handleUpdatePoint = (
    item: QuotationItem,
    pointIndex: number,
    newText: string,
  ) => {
    const currentPoints = [...getItemPoints(item)];
    currentPoints[pointIndex] = newText;
    const joinedDesc = currentPoints
      .map((pt, i) => `${i + 1}. ${pt}`)
      .join("\n");
    onUpdateItem(item.id, "points", currentPoints);
    onUpdateItem(item.id, "desc", joinedDesc);
  };

  const handleAddPointToItem = (item: QuotationItem) => {
    const currentPoints = [...getItemPoints(item), ""];
    const joinedDesc = currentPoints
      .map((pt, i) => `${i + 1}. ${pt}`)
      .join("\n");
    onUpdateItem(item.id, "points", currentPoints);
    onUpdateItem(item.id, "desc", joinedDesc);
  };

  const handleRemovePointFromItem = (
    item: QuotationItem,
    pointIndex: number,
  ) => {
    const currentPoints = getItemPoints(item).filter(
      (_, i) => i !== pointIndex,
    );
    const validPoints = currentPoints.length > 0 ? currentPoints : [""];
    const joinedDesc = validPoints.map((pt, i) => `${i + 1}. ${pt}`).join("\n");
    onUpdateItem(item.id, "points", validPoints);
    onUpdateItem(item.id, "desc", joinedDesc);
  };

  return (
    <div className="px-10 mt-3 print:px-0 print:mt-1.5">
      <Table
        className="w-full text-[12px] print:text-[12.5px] border-collapse border border-agm-box-border bg-white rounded-lg overflow-hidden shadow-xs"
        wrapperClassName="overflow-visible"
      >
        <thead className="print:table-row-group">
          <tr className="text-center text-white bg-agm-green print-avoid-break">
            <TableHeaderCell
              align="center"
              className="py-2.5 px-2 print:py-2 print:px-1 font-bold w-12 border border-agm-box-border text-white print:text-[12.5px] text-center align-middle"
            >
              S.No
            </TableHeaderCell>
            <TableHeaderCell
              align="center"
              className="py-2.5 px-3 print:py-2 print:px-2 font-bold border border-agm-box-border text-white print:text-[12.5px] text-center align-middle"
            >
              DISC
            </TableHeaderCell>
            <TableHeaderCell
              align="center"
              className="py-2.5 px-2 print:py-2 print:px-1 font-bold w-20 border border-agm-box-border text-white print:text-[12.5px] text-center align-middle"
            >
              QTY/SQM
            </TableHeaderCell>
            <TableHeaderCell
              align="center"
              className="py-2.5 px-3 print:py-2 print:px-2 font-bold w-28 border border-agm-box-border text-white print:text-[12.5px] text-center align-middle"
            >
              Price
            </TableHeaderCell>
            <TableHeaderCell
              align="center"
              className="py-2.5 px-3 print:py-2 print:px-2 font-bold w-32 border border-agm-box-border text-white print:text-[12.5px] text-center align-middle"
            >
              Total
            </TableHeaderCell>
            <TableHeaderCell
              align="center"
              className="py-2.5 print:hidden font-bold w-12 border border-agm-box-border text-white text-center align-middle"
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
            const showSectionHeader = Boolean(
              it.section && it.section !== prevSection,
            );
            const points = getItemPoints(it);
            const isMultiPoint = points.length > 1;

            return (
              <React.Fragment key={it.id}>
                {showSectionHeader && (
                  <TableRow className="bg-agm-box-bg font-bold border-t border-b border-agm-box-border print-avoid-break break-after-avoid print:break-after-avoid hover:bg-agm-box-bg">
                    <TableCell
                      colSpan={5}
                      className="py-2 px-3 print:py-1.5 print:px-2.5 text-[12.5px] print:text-[13px] font-bold text-slate-900 border border-agm-box-border"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 tracking-wide">
                          {it.section}
                        </span>
                        <span className="print:hidden text-[10px] text-slate-400 font-normal">
                          Section
                        </span>
                      </div>
                    </TableCell>
                    <td className="print:hidden border-none bg-white"></td>
                  </TableRow>
                )}

                {isMultiPoint ? (
                  <>
                    {points.map((pointText, pIdx) => {
                      const isFirst = pIdx === 0;

                      return (
                        <TableRow
                          key={pIdx}
                          className="print-avoid-break hover:bg-slate-50/40 bg-white"
                        >
                          <TableCell
                            align="center"
                            className="py-2 px-2 print:py-1.5 print:px-1 align-middle text-center font-bold text-slate-800 border border-agm-box-border w-12 print:text-[12.5px]"
                          >
                            {pIdx + 1}
                          </TableCell>

                          <TableCell className="py-2 px-3 print:py-1.5 print:px-2.5 align-top border border-agm-box-border">
                            {isFirst && availableProducts.length > 0 && (
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
                                      {Number(
                                        p.sellingPrice || p.costPrice,
                                      ).toFixed(2)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {isFirst && (
                              <div className="print:hidden flex items-center gap-1 mb-1.5">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Section:
                                </span>
                                <input
                                  className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700 w-44 font-semibold"
                                  placeholder="e.g. Guest Bathroom"
                                  value={it.section || ""}
                                  onChange={(e) =>
                                    onUpdateItem(
                                      it.id,
                                      "section",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            )}

                            <div className="hidden print:block whitespace-pre-wrap text-slate-900 text-[10px] print:text-[12px] print:leading-relaxed py-0.5 print:py-0.5">
                              {pointText}
                            </div>

                            <div className="print:hidden flex items-start gap-1">
                              <textarea
                                rows={Math.max(
                                  1,
                                  Math.ceil(pointText.length / 75),
                                )}
                                placeholder={`Enter point ${pIdx + 1} scope of work...`}
                                className={
                                  cellInputClass +
                                  " resize-y min-h-[32px] text-slate-800 leading-snug border border-transparent focus:border-emerald-300"
                                }
                                value={pointText}
                                onChange={(
                                  e: ChangeEvent<HTMLTextAreaElement>,
                                ) =>
                                  handleUpdatePoint(it, pIdx, e.target.value)
                                }
                              />
                              {points.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemovePointFromItem(it, pIdx)
                                  }
                                  className="text-slate-300 hover:text-red-500 p-0.5 mt-1 transition-colors"
                                  title="Remove this point"
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>

                            {pIdx === points.length - 1 && (
                              <div className="mt-1.5 print:hidden flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAddPointToItem(it)}
                                  className="text-[10.5px] font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                                >
                                  <Plus size={12} /> Add Point{" "}
                                  {points.length + 1}
                                </button>
                              </div>
                            )}
                          </TableCell>

                          {isFirst && (
                            <>
                              <TableCell
                                rowSpan={points.length}
                                align="center"
                                className="py-2 px-2 print:py-1.5 print:px-1 align-middle text-center font-bold border border-agm-box-border bg-white print:text-[12.5px]"
                              >
                                <input
                                  type="text"
                                  className={
                                    cellInputClass +
                                    " text-center font-bold text-slate-900 print:text-[12.5px]"
                                  }
                                  value={it.qty}
                                  onChange={(
                                    e: ChangeEvent<HTMLInputElement>,
                                  ) =>
                                    onUpdateItem(it.id, "qty", e.target.value)
                                  }
                                  placeholder="1"
                                />
                              </TableCell>

                              <TableCell
                                rowSpan={points.length}
                                align="center"
                                className="py-2 px-2 print:py-1.5 print:px-1 align-middle text-center font-mono font-semibold border border-agm-box-border bg-white print:text-[12.5px]"
                              >
                                <input
                                  type="text"
                                  placeholder="0.00"
                                  className={
                                    cellInputClass +
                                    " text-center font-mono font-semibold text-slate-900 print:text-[12.5px]"
                                  }
                                  value={
                                    isFree
                                      ? "Free"
                                      : typeof it.rate === "number"
                                        ? it.rate.toLocaleString("en-AE")
                                        : it.rate
                                  }
                                  onChange={(
                                    e: ChangeEvent<HTMLInputElement>,
                                  ) =>
                                    onUpdateItem(it.id, "rate", e.target.value)
                                  }
                                />
                              </TableCell>

                              <TableCell
                                rowSpan={points.length}
                                align="center"
                                className="py-2 px-3 print:py-1.5 print:px-2 align-middle text-center font-mono font-bold text-slate-900 border border-agm-box-border bg-white print:text-[12.5px]"
                              >
                                {isFree ? "Free" : formatCurrency(rowTotal)}
                              </TableCell>

                              <td
                                rowSpan={points.length}
                                className="py-2 px-1 align-middle text-center print:hidden border-none"
                              >
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onRemoveItem(it.id)}
                                  className="p-1 text-slate-400 hover:text-red-500"
                                  title="Remove entire package"
                                  icon={<Trash2 size={14} />}
                                />
                              </td>
                            </>
                          )}
                        </TableRow>
                      );
                    })}
                  </>
                ) : (
                  <TableRow className="print-avoid-break hover:bg-slate-50/50 bg-white">
                    <TableCell
                      align="center"
                      className="py-2 px-2 print:py-1.5 print:px-1 align-middle text-center text-slate-800 font-bold border border-agm-box-border w-12 print:text-[12.5px]"
                    >
                      {idx + 1}
                    </TableCell>

                    <TableCell className="py-2 px-3 print:py-1.5 print:px-2.5 align-top border border-agm-box-border">
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
                                {Number(p.sellingPrice || p.costPrice).toFixed(
                                  2,
                                )}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="print:hidden flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-bold">
                            Section:
                          </span>
                          <input
                            className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700 w-40 font-semibold"
                            placeholder="e.g. External Work, Kitchen..."
                            value={it.section || ""}
                            onChange={(e) =>
                              onUpdateItem(it.id, "section", e.target.value)
                            }
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddPointToItem(it)}
                          className="text-[10px] text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1 font-bold"
                          title="Add sub-numbered points (1, 2, 3...) to this item"
                        >
                          <ListPlus size={11} /> Convert to Multi-Point
                        </button>
                      </div>

                      <div className="hidden print:block whitespace-pre-wrap text-slate-900 text-[10px] print:text-[12px] print:leading-relaxed py-0.5 print:py-0.5">
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
                          " print:hidden resize-y min-h-[42px] text-slate-800 leading-snug"
                        }
                        value={it.desc}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                          onUpdateItem(it.id, "desc", e.target.value)
                        }
                      />
                    </TableCell>

                    <TableCell
                      align="center"
                      className="py-2 px-2 print:py-1.5 print:px-1 align-middle border border-agm-box-border text-center print:text-[12.5px]"
                    >
                      <input
                        type="text"
                        className={
                          cellInputClass +
                          " text-center font-bold print:text-[12.5px] text-slate-900"
                        }
                        value={it.qty}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          onUpdateItem(it.id, "qty", e.target.value)
                        }
                        placeholder="1"
                      />
                    </TableCell>

                    <TableCell
                      align="center"
                      className="py-2 px-2 print:py-1.5 print:px-1 align-middle border border-agm-box-border text-center print:text-[12.5px]"
                    >
                      <input
                        type="text"
                        placeholder="0.00"
                        className={
                          cellInputClass +
                          " text-center font-mono font-semibold print:text-[12.5px] text-slate-900"
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
                      align="center"
                      className="py-2 px-3 print:py-1.5 print:px-2 align-middle font-mono font-bold text-slate-900 border border-agm-box-border text-center print:text-[12.5px]"
                    >
                      {isFree ? "Free" : formatCurrency(rowTotal)}
                    </TableCell>

                    <td className="py-2 px-1 align-middle text-center print:hidden border-none">
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
                )}
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
