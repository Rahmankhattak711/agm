"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Search,
  Check,
  Plus,
  X,
  Layers,
} from "lucide-react";

export interface HierarchicalAccountNode {
  id: string;
  accountCode: string;
  accountName: string;
  type?: string;
  level?: number;
  parentId?: string | null;
  allowPosting?: boolean;
  subAccounts: HierarchicalAccountNode[];
}

interface HierarchicalAccountSelectProps {
  value: string; // accountId
  onChange: (accountId: string) => void;
  accounts: Array<{
    id: string;
    accountCode: string;
    accountName: string;
    type?: string;
    level?: number;
    parentId?: string | null;
    allowPosting?: boolean;
  }>;
  onOpenCreateAccount?: () => void;
  placeholder?: string;
}

export function HierarchicalAccountSelect({
  value,
  onChange,
  accounts,
  onOpenCreateAccount,
  placeholder = "Select account...",
}: HierarchicalAccountSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected account details
  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === value);
  }, [accounts, value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Build tree from accounts list
  const treeRoots = useMemo(() => {
    const map = new Map<string, HierarchicalAccountNode>();
    accounts.forEach((a) => {
      map.set(a.id, {
        id: a.id,
        accountCode: a.accountCode,
        accountName: a.accountName,
        type: a.type,
        level: a.level ?? 4,
        parentId: a.parentId,
        allowPosting: a.allowPosting,
        subAccounts: [],
      });
    });

    const roots: HierarchicalAccountNode[] = [];
    accounts.forEach((a) => {
      const item = map.get(a.id)!;
      if (a.parentId && map.has(a.parentId)) {
        map.get(a.parentId)!.subAccounts.push(item);
      } else {
        roots.push(item);
      }
    });

    const sortRecursive = (list: HierarchicalAccountNode[]) => {
      list.sort((x, y) =>
        x.accountCode.localeCompare(y.accountCode, undefined, { numeric: true })
      );
      list.forEach((item) => sortRecursive(item.subAccounts));
    };
    sortRecursive(roots);

    return roots;
  }, [accounts]);

  // Filtered tree when search is active
  const filteredTree = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return treeRoots;

    function filterNode(node: HierarchicalAccountNode): HierarchicalAccountNode | null {
      const matches =
        node.accountCode.toLowerCase().includes(q) ||
        node.accountName.toLowerCase().includes(q);

      const filteredChildren = node.subAccounts
        .map(filterNode)
        .filter((child): child is HierarchicalAccountNode => child !== null);

      if (matches || filteredChildren.length > 0) {
        return {
          ...node,
          subAccounts: filteredChildren,
        };
      }
      return null;
    }

    return treeRoots
      .map(filterNode)
      .filter((n): n is HierarchicalAccountNode => n !== null);
  }, [treeRoots, search]);

  const toggleCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const handleSelect = (acc: HierarchicalAccountNode) => {
    // Level 1 or non-postable accounts should not be selected directly
    if (acc.allowPosting === false || (acc.level && acc.level === 1)) {
      return;
    }
    onChange(acc.id);
    setIsOpen(false);
  };

  // Pillar (Level 1) badge colors
  const getPillarColor = (type?: string, code?: string) => {
    if (code?.startsWith("1") || type === "ASSET") {
      return "bg-purple-50 text-purple-700 hover:bg-purple-100/80 border-purple-200/80";
    }
    if (code?.startsWith("2") || type === "LIABILITY") {
      return "bg-rose-50 text-rose-700 hover:bg-rose-100/80 border-rose-200/80";
    }
    if (code?.startsWith("3") || type === "EQUITY") {
      return "bg-amber-50 text-amber-700 hover:bg-amber-100/80 border-amber-200/80";
    }
    if (code?.startsWith("4") || type === "REVENUE") {
      return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200/80";
    }
    return "bg-sky-50 text-sky-700 hover:bg-sky-100/80 border-sky-200/80";
  };

  // Recursive node renderer
  const renderNode = (node: HierarchicalAccountNode, depth: number = 1) => {
    const isLevel1 = depth === 1 || node.level === 1;
    const isLevel2 = depth === 2 || node.level === 2;
    const isLevel3 = depth === 3 || node.level === 3;
    const hasChildren = node.subAccounts && node.subAccounts.length > 0;
    // When searching, auto-expand all nodes
    const isCollapsed = search.trim() ? false : (collapsedNodes[node.id] ?? false);
    const isSelected = node.id === value;
    const isPostable = node.allowPosting !== false && !isLevel1;

    return (
      <div key={node.id} className="w-full">
        {/* Level 1 Pillar Banner (Matching user screenshot) */}
        {isLevel1 ? (
          <div
            onClick={(e) => hasChildren && toggleCollapse(node.id, e)}
            className={`my-1 mx-1.5 px-3 py-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${getPillarColor(
              node.type,
              node.accountCode
            )}`}
          >
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 fill-current opacity-80" />
              <span className="font-bold text-xs tracking-tight">
                {node.accountCode} - {node.accountName}
              </span>
            </div>
            {hasChildren && (
              <span className="text-xs opacity-70">
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </span>
            )}
          </div>
        ) : isLevel2 ? (
          /* Level 2 Group with indentation */
          <div
            onClick={(e) => (hasChildren ? toggleCollapse(node.id, e) : isPostable ? handleSelect(node) : undefined)}
            className={`flex items-center justify-between px-3 py-1.5 ml-4 mr-1.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100/70 cursor-pointer transition-colors ${
              isSelected ? "bg-indigo-50 text-[#5046e5]" : ""
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {hasChildren ? (
                <span onClick={(e) => toggleCollapse(node.id, e)} className="text-slate-400 hover:text-slate-700">
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </span>
              ) : (
                <span className="w-3.5" />
              )}
              {hasChildren ? (
                <FolderOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span className="font-mono text-slate-500 font-bold text-[11px]">
                {node.accountCode}
              </span>
              <span className="truncate">{node.accountName}</span>
            </div>
            {isSelected && <Check className="w-3.5 h-3.5 text-[#5046e5] shrink-0" />}
          </div>
        ) : isLevel3 && hasChildren ? (
          /* Level 3 Subgroup Folder */
          <div
            onClick={(e) => toggleCollapse(node.id, e)}
            className="flex items-center justify-between px-3 py-1.5 ml-8 mr-1.5 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-slate-100/70 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="text-slate-400">
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </span>
              <Folder className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="font-mono text-slate-500 font-semibold">
                {node.accountCode}
              </span>
              <span className="truncate">{node.accountName}</span>
            </div>
          </div>
        ) : (
          /* Leaf / Detail Level Posting Account (Selectable) */
          <div
            onClick={() => handleSelect(node)}
            className={`flex items-center justify-between px-3 py-1.5 ${
              depth >= 4 ? "ml-12" : depth === 3 ? "ml-8" : "ml-4"
            } mr-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              isSelected
                ? "bg-indigo-50 font-bold text-[#5046e5]"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono text-[11px] text-slate-500 font-medium">
                {node.accountCode}
              </span>
              <span className="text-slate-400 text-[10px]">-</span>
              <span className="truncate font-medium">{node.accountName}</span>
            </div>
            {isSelected && <Check className="w-3.5 h-3.5 text-[#5046e5] shrink-0" />}
          </div>
        )}

        {/* Child Nodes */}
        {!isCollapsed &&
          hasChildren &&
          node.subAccounts.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between transition-all cursor-pointer select-none ${
          isOpen
            ? "border-[#5046e5] ring-2 ring-[#5046e5]/10 shadow-xs"
            : !value
            ? "border-amber-300 bg-amber-50/20 text-slate-500 hover:border-slate-300"
            : "border-slate-200 hover:border-slate-300 text-slate-800"
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {selectedAccount ? (
            <>
              <span className="font-mono font-bold text-slate-600 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80">
                {selectedAccount.accountCode}
              </span>
              <span className="truncate font-semibold text-slate-800">
                {selectedAccount.accountName}
              </span>
            </>
          ) : (
            <span className="text-slate-400 font-medium">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-[#5046e5]" : ""
          }`}
        />
      </div>

      {/* Hierarchical Tree Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-[380px] sm:w-[420px] max-h-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Header Search */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/60 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search account code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5] outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Tree Scroll Body */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar min-h-[160px] max-h-[300px]">
            {filteredTree.length > 0 ? (
              filteredTree.map((root) => renderNode(root, 1))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                <Layers className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                No accounts matching &ldquo;{search}&rdquo;
              </div>
            )}
          </div>

          {/* Quick Create CTA Footer */}
          {onOpenCreateAccount && (
            <div className="p-2 border-t border-slate-100 bg-slate-50/80 shrink-0 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium px-1">
                Can&apos;t find account?
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreateAccount();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#5046e5] hover:bg-[#4338ca] text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Create Account</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

