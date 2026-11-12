"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Plus, Check, ChevronDown, X } from "lucide-react";

export interface OptionItem {
  id: string;
  name: string;
  code?: string;
  subtitle?: string;
}

interface SearchableSelectWithAddProps {
  label: string;
  placeholder?: string;
  options: OptionItem[];
  value: string;
  onChange: (value: string) => void;
  onAddNew: () => void;
  addNewLabel: string;
  required?: boolean;
  disabled?: boolean;
}

export function SearchableSelectWithAdd({
  label,
  placeholder = "Select...",
  options,
  value,
  onChange,
  onAddNew,
  addNewLabel,
  required = false,
  disabled = false,
}: SearchableSelectWithAddProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase()) ||
    (opt.code && opt.code.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedOption = options.find((opt) => opt.name === value || opt.id === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-slate-700 font-medium mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {/* Select Trigger Box */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearch("");
          }
        }}
        className={`w-full min-h-[38px] px-3 py-2 border rounded-lg text-xs flex items-center justify-between cursor-pointer transition bg-white ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20 shadow-xs" : "border-slate-300 hover:border-slate-400"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
      >
        <span className={selectedOption ? "text-slate-900 font-medium" : "text-slate-400"}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto py-1 text-xs divide-y divide-slate-50">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = selectedOption?.id === opt.id || selectedOption?.name === opt.name;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.name);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2 flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? "bg-blue-50 text-blue-900 font-semibold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div>
                      <span>{opt.name}</span>
                      {opt.code && (
                        <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({opt.code})</span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                No matching {label.toLowerCase()} found
              </div>
            )}
          </div>

          {/* Quick Add Button Footer */}
          <div className="p-1.5 border-t border-slate-100 bg-slate-50">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onAddNew();
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{addNewLabel}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
