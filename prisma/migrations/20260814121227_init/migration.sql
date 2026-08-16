-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'USER');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "DaybookType" AS ENUM ('SALES', 'PURCHASE', 'RECEIPT', 'PAYMENT', 'PETTY_CASH', 'GENERAL');

-- CreateEnum
CREATE TYPE "VatType" AS ENUM ('INPUT', 'OUTPUT');

-- CreateEnum
CREATE TYPE "PettyCashType" AS ENUM ('TOP_UP', 'DISBURSEMENT');

-- CreateEnum
CREATE TYPE "PettyCashCategoryType" AS ENUM ('BANK_CHARGE', 'LOCAL_GOVERNMENT', 'OPERATIONAL_EXPENSE');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('COMPANY_VEHICLE', 'MACHINERY_EQUIPMENT', 'OFFICE_EQUIPMENT', 'FURNITURE_FIXTURES', 'COMPUTER_HARDWARE', 'LEASEHOLD_IMPROVEMENT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('WPS_BANK_TRANSFER', 'CASH', 'CHEQUE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" UUID NOT NULL,
    "account_code" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "parent_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" UUID NOT NULL,
    "entry_number" TEXT NOT NULL,
    "entry_date" DATE NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "is_posted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entry_lines" (
    "id" UUID NOT NULL,
    "journal_entry_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daybook_entries" (
    "id" UUID NOT NULL,
    "voucher_number" TEXT NOT NULL,
    "entry_date" DATE NOT NULL,
    "type" "DaybookType" NOT NULL,
    "party_name" TEXT,
    "description" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "journal_entry_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daybook_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vat_rates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "vat_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vat_entries" (
    "id" UUID NOT NULL,
    "journal_entry_line_id" UUID NOT NULL,
    "vat_rate_id" UUID,
    "taxable_amount" DECIMAL(15,2) NOT NULL,
    "vat_amount" DECIMAL(15,2) NOT NULL,
    "vat_type" "VatType" NOT NULL,

    CONSTRAINT "vat_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petty_cash_transactions" (
    "id" UUID NOT NULL,
    "transaction_date" DATE NOT NULL,
    "voucher_number" TEXT NOT NULL,
    "category_type" "PettyCashCategoryType" NOT NULL DEFAULT 'OPERATIONAL_EXPENSE',
    "category" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "transaction_type" "PettyCashType" NOT NULL,
    "receipt_image_url" TEXT,
    "notes" TEXT,
    "account_id" UUID,
    "approved_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "petty_cash_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_assets" (
    "id" UUID NOT NULL,
    "asset_code" TEXT NOT NULL,
    "asset_name" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL DEFAULT 'OFFICE_EQUIPMENT',
    "purchase_date" DATE NOT NULL,
    "cost" DECIMAL(15,2) NOT NULL,
    "salvage_value" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "depreciation_rate" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "registration_number" TEXT,
    "chassis_number" TEXT,
    "assigned_to" TEXT,
    "asset_account_id" UUID NOT NULL,
    "accumulated_depr_account_id" UUID NOT NULL,
    "depr_expense_account_id" UUID NOT NULL,

    CONSTRAINT "fixed_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depreciation_schedules" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "opening_book_value" DECIMAL(15,2) NOT NULL,
    "depreciation_amount" DECIMAL(15,2) NOT NULL,
    "closing_book_value" DECIMAL(15,2) NOT NULL,
    "is_posted" BOOLEAN NOT NULL DEFAULT false,
    "journal_entry_id" UUID,

    CONSTRAINT "depreciation_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "employee_code" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "department" TEXT,
    "designation" TEXT,
    "joining_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "emirates_id" TEXT,
    "passport_no" TEXT,
    "labor_card_no" TEXT,
    "basic_salary" DECIMAL(12,2) NOT NULL,
    "housing_allowance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "transport_allowance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "other_allowances" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'WPS_BANK_TRANSFER',
    "bank_name" TEXT,
    "iban" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_records" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "basic_salary" DECIMAL(12,2) NOT NULL,
    "allowances" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "net_salary" DECIMAL(12,2) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "payment_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_balance_sheet_summaries" (
    "id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "total_assets" DECIMAL(15,2) NOT NULL,
    "total_liabilities" DECIMAL(15,2) NOT NULL,
    "total_equity" DECIMAL(15,2) NOT NULL,
    "retained_earnings" DECIMAL(15,2) NOT NULL,
    "is_finalized" BOOLEAN NOT NULL DEFAULT false,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_balance_sheet_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_account_code_key" ON "chart_of_accounts"("account_code");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_entry_number_key" ON "journal_entries"("entry_number");

-- CreateIndex
CREATE UNIQUE INDEX "daybook_entries_voucher_number_key" ON "daybook_entries"("voucher_number");

-- CreateIndex
CREATE UNIQUE INDEX "vat_entries_journal_entry_line_id_key" ON "vat_entries"("journal_entry_line_id");

-- CreateIndex
CREATE UNIQUE INDEX "petty_cash_transactions_voucher_number_key" ON "petty_cash_transactions"("voucher_number");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_assets_asset_code_key" ON "fixed_assets"("asset_code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_emirates_id_key" ON "employees"("emirates_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_records_employee_id_month_year_key" ON "payroll_records"("employee_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_balance_sheet_summaries_year_month_key" ON "monthly_balance_sheet_summaries"("year", "month");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daybook_entries" ADD CONSTRAINT "daybook_entries_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daybook_entries" ADD CONSTRAINT "daybook_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vat_entries" ADD CONSTRAINT "vat_entries_journal_entry_line_id_fkey" FOREIGN KEY ("journal_entry_line_id") REFERENCES "journal_entry_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vat_entries" ADD CONSTRAINT "vat_entries_vat_rate_id_fkey" FOREIGN KEY ("vat_rate_id") REFERENCES "vat_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_transactions" ADD CONSTRAINT "petty_cash_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_transactions" ADD CONSTRAINT "petty_cash_transactions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_asset_account_id_fkey" FOREIGN KEY ("asset_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_accumulated_depr_account_id_fkey" FOREIGN KEY ("accumulated_depr_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_depr_expense_account_id_fkey" FOREIGN KEY ("depr_expense_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depreciation_schedules" ADD CONSTRAINT "depreciation_schedules_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depreciation_schedules" ADD CONSTRAINT "depreciation_schedules_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "fixed_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
