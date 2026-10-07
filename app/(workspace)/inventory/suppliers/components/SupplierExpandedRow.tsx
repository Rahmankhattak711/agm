"use client";

import React from "react";
import {
  BuildingIcon,
  EditIcon,
  TrashIcon,
  PackageIcon,
  FileSpreadsheetIcon,
  ShieldCheckIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
} from "@/components/icons";
import {
  Button,
  Badge,
  Card,
  CustomRowExpand,
  ExpandedRowSection,
} from "@/components/ui";
import { Supplier } from "@/lib/hooks/api-hooks";

export interface SupplierExpandedRowProps {
  supplier: Supplier;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function SupplierExpandedRow({
  supplier,
  onEdit,
  onDelete,
  onClose,
}: SupplierExpandedRowProps) {
  const skusCount = supplier._count?.products || 0;
  const posCount = supplier._count?.purchaseOrders || 0;

  return (
    <CustomRowExpand
      colSpan={7}
      onClose={onClose}
      headerLeft={
        <>
          <span className="px-2.5 py-1 rounded-lg bg-teal-900 text-teal-200 font-mono font-bold text-xs shadow-2xs">
            {supplier.supplierCode}
          </span>
          <span className="text-xs font-bold text-slate-900">
            {supplier.name}
          </span>
          {supplier.contactPerson && (
            <span className="text-[11px] font-medium text-slate-500">
              ({supplier.contactPerson})
            </span>
          )}
          {supplier.phone && (
            <span className="text-[11px] font-mono text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
              {supplier.phone}
            </span>
          )}
          <Badge tone={supplier.trn ? "emerald" : "slate"}>
            {supplier.trn ? `TRN: ${supplier.trn}` : "Standard Vendor"}
          </Badge>
        </>
      }
      headerRight={
        <>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              icon={
                <EditIcon size={14} className="w-3.5 h-3.5 text-blue-700" />
              }
              className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              Edit Profile
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              icon={
                <TrashIcon size={14} className="w-3.5 h-3.5 text-rose-600" />
              }
              className="text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border-rose-200 cursor-pointer shadow-2xs"
            >
              Delete
            </Button>
          )}
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card
          id="supplier-skus"
          value={`${skusCount} SKUs`}
          title="Catalog SKUs"
          subtitle="Materials and inventory items"
          icon={<PackageIcon size={16} />}
          accentColor="purple"
        />

        <Card
          id="supplier-pos"
          value={`${posCount} Orders`}
          title="Purchase Orders"
          subtitle="Total procurement records"
          icon={<FileSpreadsheetIcon size={16} />}
          accentColor="blue"
        />

        <Card
          id="supplier-tax"
          value={supplier.trn ? "VAT Registered" : "General Vendor"}
          title="Tax Compliance"
          subtitle={supplier.trn ? `TRN: ${supplier.trn}` : "No TRN on file"}
          icon={<ShieldCheckIcon size={16} />}
          accentColor={supplier.trn ? "emerald" : "slate"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ExpandedRowSection
          title="Vendor Profile & Identification"
          icon={<BuildingIcon size={14} />}
          badge="Verified Partner"
        >
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Company Name
              </span>
              <span className="font-bold text-slate-800">{supplier.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Supplier Code
              </span>
              <span className="font-mono font-bold text-teal-800">
                {supplier.supplierCode}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Contact Person
              </span>
              <span className="font-medium text-slate-800">
                {supplier.contactPerson || "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                UAE Tax TRN
              </span>
              <span className="font-mono font-bold text-emerald-800">
                {supplier.trn || "Not Registered"}
              </span>
            </div>
          </div>
        </ExpandedRowSection>

        <ExpandedRowSection
          title="Communication & Address"
          icon={<MapPinIcon size={14} />}
          badge={
            supplier.phone || supplier.email ? "Direct Contact" : undefined
          }
        >
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Phone Number
              </span>
              {supplier.phone ? (
                <a
                  href={`tel:${supplier.phone}`}
                  className="font-mono font-medium text-teal-800 hover:underline inline-flex items-center gap-1"
                >
                  <PhoneIcon size={12} className="text-teal-700" />
                  {supplier.phone}
                </a>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Email Address
              </span>
              {supplier.email ? (
                <a
                  href={`mailto:${supplier.email}`}
                  className="font-medium text-teal-800 hover:underline truncate block inline-flex items-center gap-1 max-w-[170px]"
                  title={supplier.email}
                >
                  <MailIcon size={12} className="text-teal-700 shrink-0" />
                  <span className="truncate">{supplier.email}</span>
                </a>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Physical Address / Warehouse
              </span>
              <span className="text-slate-700 font-medium">
                {supplier.address || "No address specified"}
              </span>
            </div>
          </div>
        </ExpandedRowSection>
      </div>
    </CustomRowExpand>
  );
}
