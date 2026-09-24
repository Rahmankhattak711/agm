-- AlterTable
ALTER TABLE "salary_certificates" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "custom_letters" (
    "id" UUID NOT NULL,
    "ref_number" TEXT NOT NULL,
    "doc_title" TEXT NOT NULL DEFAULT 'OFFICIAL COMPANY LETTER',
    "date" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "addressee" TEXT NOT NULL DEFAULT 'To Whom It May Concern,',
    "addressee_subtitle" TEXT,
    "subject" TEXT NOT NULL DEFAULT '',
    "salutation" TEXT NOT NULL DEFAULT 'Dear Sir / Madam,',
    "sections" JSONB NOT NULL DEFAULT '[]',
    "closing_text" TEXT,
    "signatory_company" TEXT NOT NULL DEFAULT 'AGM Fitout Technical Services LLC',
    "signatory_title" TEXT NOT NULL DEFAULT 'Authorized Signatory,',
    "signatory_name" TEXT NOT NULL DEFAULT 'Zeeshan Ahmad',
    "signatory_designation" TEXT NOT NULL DEFAULT 'Authorized Signatory',
    "show_stamp_and_signature" BOOLEAN NOT NULL DEFAULT true,
    "company_stamp_url" TEXT,
    "signatory_signature_url" TEXT,
    "notes" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_letters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_letters_ref_number_key" ON "custom_letters"("ref_number");

-- AddForeignKey
ALTER TABLE "custom_letters" ADD CONSTRAINT "custom_letters_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
