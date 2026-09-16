"use client";

import React from "react";
import AgreementTemplate from "@/components/documents/AgreementTemplate";
import { SAMPLE_RENOVATION_AGREEMENT } from "@/components/documents/constants";

export default function AgreementsAndDocumentsPage() {
  return (
    <div className="w-full pb-10">
      <AgreementTemplate initialData={SAMPLE_RENOVATION_AGREEMENT} />
    </div>
  );
}
