"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, Plus, X, Package, Tag } from "lucide-react";
import { Product } from "@/lib/hooks/api-hooks";
import { formatAed } from "@/lib/utils/format";

export interface SearchableProductSelectProps {
  value: string; // productId
  onChange: (productId: string) => void;
  products: Product[];
  onAddNewProduct?: (typedName: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function SearchableProductSelect({
  value,
  onChange,
  products = [],
  onAddNewProduct,
  placeholder = "-- Type or Select Product --",
  required = false,
}: SearchableProductSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Find currently selected product
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === value) || null;
  }, [products, value]);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return products.slice(0, 30);
    }
    return products
      .filter((p) => {
        const name = (p.name || "").toLowerCase();
        const sku = (p.sku || "").toLowerCase();
        const brand = (p.brand || "").toLowerCase();
        const supSku = (p.supplierSku || "").toLowerCase();
        return (
          name.includes(q) ||
          sku.includes(q) ||
          brand.includes(q) ||
          supSku.includes(q)
        );
      })
      .slice(0, 40);
  }, [products, search]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Reset highlighted index on search change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelectProduct = (product: Product) => {
    onChange(product.id);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
    setIsOpen(false);
  };

  const handleTriggerClick = () => {
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 40);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 40);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredProducts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredProducts[highlightedIndex]) {
        handleSelectProduct(filteredProducts[highlightedIndex]);
      } else if (search.trim() && onAddNewProduct) {
        onAddNewProduct(search.trim());
        setIsOpen(false);
        setSearch("");
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSearch("");
    }
  };

  return (
    <div ref={containerRef} className="relative w-full text-xs" onKeyDown={handleKeyDown}>
      {/* Hidden input for form validation */}
      <input
        type="text"
        value={value}
        onChange={() => {}}
        required={required}
        className="sr-only"
        tabIndex={-1}
      />

      {/* Main Trigger Button / Search Field */}
      {!isOpen ? (
        <button
          type="button"
          onClick={handleTriggerClick}
          className={`w-full py-2 px-3 rounded-xl border text-left flex items-center justify-between gap-2 shadow-2xs transition-all cursor-pointer bg-white ${
            selectedProduct
              ? "border-slate-300 hover:border-slate-400"
              : "border-slate-200 hover:border-indigo-300 text-slate-400"
          } focus:outline-hidden focus:ring-2 focus:ring-[#5046e5]/20`}
        >
          {selectedProduct ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Package className="w-3.5 h-3.5 text-[#5046e5] shrink-0" />
              <div className="truncate font-medium text-slate-900">
                <span>{selectedProduct.name}</span>
                {selectedProduct.brand && (
                  <span className="text-slate-500 text-[11px] ml-1">
                    [{selectedProduct.brand}]
                  </span>
                )}
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                {selectedProduct.sku}
              </span>
              {selectedProduct.costPrice && Number(selectedProduct.costPrice) > 0 && (
                <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">
                  AED {formatAed(selectedProduct.costPrice)}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 font-medium truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{placeholder}</span>
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            {selectedProduct && (
              <span
                onClick={handleClear}
                className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
                title="Clear product"
              >
                <X className="w-3 h-3" />
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </button>
      ) : (
        /* Active Search Input */
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-[#5046e5] absolute left-3 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type product name, brand, SKU or ref..."
            className="w-full py-2 pl-8.5 pr-8 rounded-xl border border-[#5046e5] bg-white text-xs font-medium text-slate-900 shadow-sm focus:outline-hidden focus:ring-2 focus:ring-[#5046e5]/25"
          />
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setSearch("");
            }}
            className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-100"
          style={{ minWidth: "320px" }}
        >
          {/* Header count info */}
          <div className="px-3 py-1.5 bg-slate-50/80 border-b border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              {search.trim() ? (
                <>
                  Found <strong className="text-slate-800">{filteredProducts.length}</strong> matching item(s)
                </>
              ) : (
                <>
                  Showing catalog items ({products.length} total)
                </>
              )}
            </span>
            <span className="text-[10px] text-slate-400">↑↓ to navigate · Enter to select</span>
          </div>

          {/* Product Items List */}
          <div
            ref={listRef}
            className="overflow-y-auto divide-y divide-slate-100 flex-1 custom-scrollbar p-1"
          >
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-slate-500 space-y-1">
                <p className="font-medium text-slate-700">No matching products found</p>
                <p className="text-[11px] text-slate-400">
                  Product &ldquo;{search}&rdquo; is not yet registered in catalog.
                </p>
              </div>
            ) : (
              filteredProducts.map((p, idx) => {
                const isSelected = p.id === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`p-2.5 rounded-lg flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                      isHighlighted
                        ? "bg-indigo-50/80 text-indigo-950"
                        : isSelected
                        ? "bg-slate-50 text-slate-900"
                        : "hover:bg-slate-50/80 text-slate-800"
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs truncate">
                          {p.name}
                        </span>
                        {p.brand && (
                          <span className="text-[10.5px] text-slate-500 font-medium">
                            [{p.brand}]
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap text-[10.5px] text-slate-500">
                        <span className="font-mono bg-slate-100 px-1 rounded text-slate-600">
                          {p.sku}
                        </span>
                        {p.supplierSku && (
                          <span className="truncate">
                            • Ref: {p.supplierSku}
                          </span>
                        )}
                        {p.unit && <span>• {p.unit}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {p.costPrice !== undefined && Number(p.costPrice) > 0 && (
                        <div className="text-right font-mono">
                          <span className="text-[10px] text-slate-400 block">Cost</span>
                          <span className="font-bold text-slate-900 text-xs">
                            AED {formatAed(p.costPrice)}
                          </span>
                        </div>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#5046e5]" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Create New Product Button */}
          {onAddNewProduct && (
            <div className="p-2 border-t border-slate-100 bg-slate-50/90 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onAddNewProduct(search.trim());
                  setIsOpen(false);
                  setSearch("");
                }}
                className="w-full py-1.5 px-3 rounded-lg border border-dashed border-indigo-300 bg-white hover:bg-indigo-50/80 text-[#5046e5] font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {search.trim()
                    ? `+ Add "${search.trim()}" as new shop product`
                    : "+ Add New Shop Product"}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

