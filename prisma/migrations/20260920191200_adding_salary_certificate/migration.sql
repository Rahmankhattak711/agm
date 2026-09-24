-- CreateTable
CREATE TABLE "salary_certificates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ref_number" TEXT NOT NULL,
    "date" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "addressee" TEXT NOT NULL DEFAULT 'To Whom It May Concern,',
    "employee_prefix" TEXT NOT NULL DEFAULT 'Mr.',
    "employee_name" TEXT NOT NULL DEFAULT '',
    "emirates_id" TEXT NOT NULL DEFAULT '',
    "joining_date" TEXT NOT NULL DEFAULT '',
    "company_name" TEXT NOT NULL DEFAULT 'AGM Fitout Technical Services LLC',
    "position" TEXT NOT NULL DEFAULT '',
    "purpose_disclaimer" TEXT NOT NULL DEFAULT '',
    "monthly_salary_num" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "monthly_salary_text" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "signatory_company" TEXT NOT NULL DEFAULT 'AGM Fitout Technical Services LLC',
    "signatory_title" TEXT NOT NULL DEFAULT 'Authorized Signatory,',
    "signatory_name" TEXT NOT NULL DEFAULT 'Zeeshan Ahmad',
    "signatory_designation" TEXT NOT NULL DEFAULT 'Accountant',
    "show_stamp_and_signature" BOOLEAN NOT NULL DEFAULT true,
    "city" TEXT NOT NULL DEFAULT 'Dubai',
    "po_box" TEXT NOT NULL DEFAULT 'No',
    "landline" TEXT NOT NULL DEFAULT 'New 1143 Business Center LLC',
    "telephone" TEXT NOT NULL DEFAULT '+971 4 280 4184',
    "vat_number" TEXT NOT NULL DEFAULT '104094432200003',
    "footer_company_name" TEXT NOT NULL DEFAULT 'AGM Fitout Technical Services',
    "registered_address" TEXT NOT NULL DEFAULT '',
    "notes" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "salary_certificates_ref_number_key" ON "salary_certificates"("ref_number");

-- AddForeignKey
ALTER TABLE "salary_certificates" ADD CONSTRAINT "salary_certificates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
