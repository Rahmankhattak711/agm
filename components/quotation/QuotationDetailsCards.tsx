import { formatUaePhone } from "@/lib/utils/phone";
"use client";

import React, { useState } from "react";
import { QuotationMeta } from "./constants";
import { useCustomers, Customer } from "@/lib/hooks/api-hooks";
import { CustomerCreateModal } from "@/app/(workspace)/commercial/customers/components";
import {
  CheckCircle2Icon,
  AlertCircleIcon,
  PlusIcon,
} from "@/components/icons";

export interface QuotationDetailsCardsProps {
  meta: QuotationMeta;
  onUpdateMeta: (key: keyof QuotationMeta, val: string) => void;
  onSelectCustomer?: (customer: Customer | null) => void;
}

export const QuotationDetailsCards: React.FC<QuotationDetailsCardsProps> = ({
  meta,
  onUpdateMeta,
  onSelectCustomer,
}) => {
  const { data: customers = [], isLoading: isLoadingCustomers } =
    useCustomers();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const currentCustomer = customers.find((c) => c.id === meta.customerId);

  const handleSelectCustomer = (customer: Customer) => {
    onUpdateMeta("customerId", customer.id);
    onUpdateMeta("customer", customer.name);
    if (customer.address) onUpdateMeta("address", customer.address);
    if (customer.email) onUpdateMeta("email", customer.email);
    if (customer.phone) onUpdateMeta("mobile", customer.phone);
    setIsSelectorOpen(false);
    if (onSelectCustomer) onSelectCustomer(customer);
  };

  const inputBase =
    "flex-1 bg-transparent outline-none focus:bg-emerald-50/80 rounded px-1.5 py-0.5 text-slate-800 border-b border-dashed border-transparent hover:border-slate-300 focus:border-emerald-500 transition-colors print:bg-transparent print:p-0 print:border-none print:text-[12.5px] print:text-slate-900";

  const labelBase =
    "w-24 print:w-26 text-[11px] print:text-[12px] font-semibold text-slate-500 print:text-slate-600 shrink-0";

  const isCustomerSelected = Boolean(meta.customerId || meta.customer.trim());

  return (
    <>
      <div className="grid grid-cols-2 gap-4 print:gap-3 px-10 py-3.5 print:px-0 print:py-2 text-[12px] print:text-[12.5px] print-avoid-break">
        <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-2 print:mb-1.5 border-b border-slate-200/60 pb-1 print:pb-1">
            <div className="font-bold text-slate-900 uppercase text-[11px] print:text-[12px] tracking-wider text-agm-green flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
              CLIENT / BILL TO
            </div>

            <div className="flex items-center gap-1.5 print:hidden">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="text-[10px] font-bold text-white bg-agm-green hover:bg-agm-green-2 px-2 py-0.5 rounded cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                title="Create a new customer profile"
              >
                <PlusIcon size={11} strokeWidth={2.5} />
                <span>New Customer</span>
              </button>
            </div>
          </div>

          {!meta.customerId && (
            <div className="mb-2.5 p-2.5 rounded-lg bg-amber-50/95 border border-amber-300 text-amber-900 text-xs print:hidden space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11.5px]">
                  <AlertCircleIcon
                    size={14}
                    className="text-amber-600 shrink-0"
                  />
                  <span>Customer Profile Required</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900">
                  Required
                </span>
              </div>
              <p className="text-[10.5px] text-amber-800 leading-snug">
                First select or create a registered customer. Quotations cannot
                be generated without an existing customer.
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={meta.customerId || ""}
                  onChange={(e) => {
                    const found = customers.find(
                      (c) => c.id === e.target.value,
                    );
                    if (found) handleSelectCustomer(found);
                  }}
                  className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium outline-none focus:border-agm-green shadow-2xs cursor-pointer"
                >
                  <option value="">
                    {isLoadingCustomers
                      ? "Loading customers..."
                      : `-- Choose from ${customers.length} Registered Customers --`}
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.customerCode}] {c.name}{" "}
                      {c.companyName ? `• ${c.companyName}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {meta.customerId && (
            <div className="mb-2 p-1.5 px-2 bg-emerald-50/90 border border-emerald-200 rounded-lg flex items-center justify-between gap-2 print:hidden">
              <div className="flex items-center gap-1.5 min-w-0">
                <CheckCircle2Icon
                  size={14}
                  className="text-emerald-700 shrink-0"
                />
                <div className="min-w-0 flex items-center gap-1.5 truncate">
                  {currentCustomer?.customerCode && (
                    <span className="font-bold text-[11px] text-emerald-800 font-mono">
                      [{currentCustomer.customerCode}]
                    </span>
                  )}
                  <span className="font-bold text-[11.5px] text-emerald-950 truncate">
                    {meta.customer}
                  </span>
                  <span className="text-[9.5px] bg-emerald-200/70 text-emerald-900 px-1 py-0.2 rounded font-bold">
                    Linked
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSelectorOpen((prev) => !prev)}
                className="text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded px-2 py-0.5 cursor-pointer shadow-2xs hover:bg-slate-50 transition-colors shrink-0"
              >
                {isSelectorOpen ? "Hide" : "Change"}
              </button>
            </div>
          )}

          {meta.customerId && isSelectorOpen && (
            <div className="mb-2.5 p-2 bg-slate-100 rounded-lg border border-slate-200 text-xs print:hidden space-y-1.5">
              <span className="text-[10.5px] font-bold text-slate-600 block">
                Switch to another customer:
              </span>
              <select
                value={meta.customerId || ""}
                onChange={(e) => {
                  const found = customers.find((c) => c.id === e.target.value);
                  if (found) handleSelectCustomer(found);
                }}
                className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-medium outline-none focus:border-agm-green"
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.customerCode}] {c.name}{" "}
                    {c.companyName ? `• ${c.companyName}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1 print:space-y-1">
            <div className="flex items-center gap-1">
              <span className={labelBase}>Client Name:</span>
              <input
                placeholder={
                  isCustomerSelected
                    ? "Client / Company Name"
                    : "Select or create customer..."
                }
                className={
                  inputBase + " font-bold text-slate-900 print:text-[12.5px]"
                }
                value={meta.customer}
                onChange={(e) => onUpdateMeta("customer", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1">
              <span className={labelBase}>Address:</span>
              <input
                placeholder="Client Address, Dubai, UAE"
                className={inputBase}
                value={meta.address}
                onChange={(e) => onUpdateMeta("address", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1">
              <span className={labelBase}>Email:</span>
              <input
                placeholder="client@email.com"
                type="email"
                className={inputBase}
                value={meta.email || ""}
                onChange={(e) => onUpdateMeta("email", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1">
              <span className={labelBase}>Mobile:</span>
              <input
                placeholder="+971 50 000 0000"
                className={inputBase}
                value={meta.mobile}
                onChange={(e) => onUpdateMeta("mobile", formatUaePhone(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl shadow-2xs">
          <div className="font-bold mb-2 print:mb-1.5 text-slate-900 uppercase text-[11px] print:text-[12px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
            PROJECT / SITE DETAILS
          </div>
          <div className="space-y-1 print:space-y-1">
            <div className="flex items-center gap-1">
              <span className={labelBase}>Project:</span>
              <input
                placeholder="Project / Scope Name"
                className={
                  inputBase + " font-bold text-slate-900 print:text-[12.5px]"
                }
                value={meta.project}
                onChange={(e) => onUpdateMeta("project", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1">
              <span className={labelBase}>Location:</span>
              <input
                placeholder="Site / Building Location (e.g. Al Furjan, Dubai)"
                className={inputBase}
                value={meta.location}
                onChange={(e) => onUpdateMeta("location", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1">
              <span className={labelBase}>Reference:</span>
              <input
                placeholder="Enquiry / RFQ Reference"
                className={inputBase}
                value={meta.reference}
                onChange={(e) => onUpdateMeta("reference", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1">
              <span className={labelBase}>Contact:</span>
              <input
                placeholder="Phone & Email"
                className={inputBase}
                value={meta.contact}
                onChange={(e) => onUpdateMeta("contact", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <CustomerCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newCustomer) => {
          if (newCustomer) {
            handleSelectCustomer(newCustomer);
          }
          setIsCreateModalOpen(false);
        }}
      />
    </>
  );
};

export default QuotationDetailsCards;
