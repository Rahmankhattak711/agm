"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Input, UaePhoneInput } from "@/components/ui";
import { cleanUaePhone } from "@/lib/utils/phone";
import { Building2, Check, User, Phone, Mail, MapPin, Hash, Sparkles } from "lucide-react";
import { useCreateSupplier, Supplier } from "@/lib/hooks/api-hooks";
import { toast } from "@/lib/toast";

export interface QuickAddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (supplier: Supplier) => void;
  initialName?: string;
}

export const QuickAddVendorModal: React.FC<QuickAddVendorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialName = "",
}) => {
  const [name, setName] = useState(initialName);
  const [trn, setTrn] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const createSupplierMutation = useCreateSupplier();

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setTrn("");
      setContactPerson("");
      setPhone("");
      setEmail("");
      setAddress("");
      setError("");
    }
  }, [isOpen, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vendor name is required");
      return;
    }

    setError("");
    try {
      const created = await createSupplierMutation.mutateAsync({
        supplierCode: "", // Backend will auto-generate SUP-XXXX
        name: name.trim(),
        trn: trn.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        phone: cleanUaePhone(phone) || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });

      toast.success(`Vendor "${created.name}" created successfully!`);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create vendor");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Supplier / Vendor"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 flex items-center gap-2.5 text-indigo-900 text-xs font-medium">
          <Sparkles className="w-4 h-4 text-[#5046e5] shrink-0" />
          <span>
            This vendor will be permanently added to your Suppliers directory and immediately selected.
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="block font-bold text-slate-800 text-xs">
            Vendor Legal Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Al-Futtaim Engineering LLC"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#5046e5]/30 focus:border-[#5046e5] shadow-2xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 text-xs">
              VAT TRN (15 Digits)
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                maxLength={15}
                placeholder="100XXXXXXXXX003"
                value={trn}
                onChange={(e) => setTrn(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#5046e5]/30 focus:border-[#5046e5] shadow-2xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 text-xs">
              Contact Person
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Sales Manager"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#5046e5]/30 focus:border-[#5046e5] shadow-2xs"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <UaePhoneInput
            label="Phone Number"
            value={phone}
            onChange={setPhone}
          />

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 text-xs">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="billing@vendor.ae"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#5046e5]/30 focus:border-[#5046e5] shadow-2xs"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block font-bold text-slate-700 text-xs">
            Office / Yard Address
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Al Quoz Industrial 3, Dubai, UAE"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#5046e5]/30 focus:border-[#5046e5] shadow-2xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={createSupplierMutation.isPending}
            icon={<Check className="w-3.5 h-3.5" />}
            className="bg-[#5046e5] hover:bg-[#4338ca] text-white font-bold cursor-pointer"
          >
            Create & Select Vendor
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default QuickAddVendorModal;
