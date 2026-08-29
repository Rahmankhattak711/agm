<p align="center">
  <img src="public/assets/logo.png" alt="AGM Aesthetic House Logo" width="220" />
</p>

<h1 align="center">AGM Aesthetic House ERP & Financial Management System</h1>

<p align="center">
  <strong>Enterprise-grade ERP, Double-Entry Accounting, Commercial Vouchers Engine, Inventory & Operations Platform</strong><br>
  Designed for <em>AGM Aesthetic House Fitout Technical Services L.L.C</em> (Dubai, UAE)
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Prisma-6.19-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript" alt="TypeScript" />
</p>

---

## 🌟 Key Modules & Capabilities

### 1. 📑 Commercial Vouchers Engine (`/commercial`)

Transform commercial transactions into an end-to-end connected workflow spanning Sales, Purchasing, Inventory, Payments, and Automated Accounting.

#### **A. Sales Transaction Flow**

`Quotation ➔ Sales Order ➔ Sales Invoice ➔ Customer Payment ➔ Credit Note (Sales Return)`

- **Commercial Quotations (`/commercial/quotations`)**:
  - Multi-point Bill of Quantities (BOQ) scope builder with live product catalogs.
  - Dynamic 5% UAE VAT, payment terms, discounts, and official A4 PDF printable format.
  - One-click **"Convert to Sales Order"** upon customer acceptance.
- **Sales Orders & Contracts (`/commercial/sales-orders`)**:
  - Tracks confirmed client orders, delivery milestones, project scopes, and order pipelines (`CONFIRMED`, `PROCESSING`, `COMPLETED`).
  - One-click **"Convert to Sales Invoice"**.
- **Sales Invoices & Tax Billing (`/commercial/sales-invoices`)**:
  - UAE FTA-compliant tax invoices with TRN tracking, 5% Output VAT calculation, and printable invoice documents.
  - **Automated Double-Entry Accounting**: One-click **"Post to GL"** creates general journal entries:
    - `Dr. Accounts Receivable (Asset)`
    - `Cr. Sales Revenue (Revenue)`
    - `Cr. VAT Output Tax Payable (Liability)`
- **Customer Payments & Receipts (`/commercial/customer-payments`)**:
  - Records payments (Bank Transfer, Cheque, Cash, Card), automatically deducts invoice balances, and creates payment receipts.
  - Automated GL posting (`Dr. Bank/Cash`, `Cr. Accounts Receivable`).
- **Sales Returns & Credit Notes (`/commercial/credit-notes`)**:
  - Issues credit notes for project scope adjustments or material returns, automatically reversing Accounts Receivable and Output VAT.

---

#### **B. Purchasing & Procurement Flow**

`Purchase Request ➔ Purchase Order ➔ Goods Received (GRN) ➔ Supplier Bill ➔ Supplier Payment ➔ Debit Note (Purchase Return)`

- **Purchase Requests & Requisitions (`/commercial/purchase-requests`)**:
  - Site team material requisitions, required-by dates, and department approval workflows (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `CONVERTED`).
  - One-click **"Convert to Purchase Order"**.
- **Purchase Orders (`/commercial/purchase-orders` & `/inventory/purchase-orders`)**:
  - Supplier procurement orders, pricing lines, status tracking (`ORDERED`, `RECEIVED`), and printable POs.
- **Goods Received Notes - GRN (`/commercial/goods-received`)**:
  - Receives supplier deliveries with warehouse facility routing and delivery note tracking.
  - Records accepted vs. damaged quantities and **automatically increments warehouse inventory on hand** with `PURCHASE_IN` stock movements.
- **Supplier Bills & Accounts Payable (`/commercial/supplier-bills`)**:
  - Vendor tax bills, 5% Input VAT recovery, and automated AP posting:
    - `Dr. Purchase Materials / Direct Cost (Expense)`
    - `Dr. VAT Input Tax Payable (Asset/Liability)`
    - `Cr. Accounts Payable (Liability)`
- **Supplier Payments & Disbursals (`/commercial/supplier-payments`)**:
  - Disburses payments to vendors via RAK Bank / Cheque, clearing open bills (`Dr. Accounts Payable`, `Cr. Bank/Cash`).
- **Purchase Returns & Debit Notes (`/commercial/debit-notes`)**:
  - Issues debit notes for rejected or damaged shipments, automatically deducting Accounts Payable liabilities.

---

#### **C. Master Data & Statements**

- **Customer Directory & Statements (`/commercial/customers`)**:
  - Comprehensive client database with credit limits, TRN numbers, and a live **Statement of Account Ledger** tracking chronological debits, credits, and running balances.
- **Suppliers & Vendors (`/inventory/suppliers`)**:
  - Vendor master directory with payment terms and purchase history.
- **Products & Materials Catalog (`/inventory/products`)**:
  - SKU catalogs, unit pricing, cost rates, and warehouse reorder points.
- **Warehouses & Storage Facilities (`/inventory/warehouses`)**:
  - Multi-warehouse location and facility management.

---

### 2. 💼 Financial Accounting & General Ledger (`/finance`)

- **Interactive Financial & Operations Dashboard (`/dashboard`)**:
  - Real-time revenue metrics, gross/net margins, asset balances, and WPS workforce statistics.
- **Chart of Accounts (`/finance/accounts`)**:
  - Full double-entry general ledger with Assets, Liabilities, Equity, Revenue, and Expense account hierarchies.
- **General Journal Entries (`/finance/journal-entries`)**:
  - Standardized double-entry transaction posting, draft/posted controls, and debit/credit balance integrity checks.

---

### 3. 📊 Financial Reports & Statutory Statements (`/finance/reports`)

- **Executive Summary (`/finance/reports?tab=summary`)**:
  - High-level financial KPIs, liquidity ratios, working capital, and audit health indicators.
- **Statement of Profit & Loss (`/finance/reports?tab=profit-loss`)**:
  - Dynamic Period Reporting: Daily, Weekly, Monthly, Yearly (Fiscal), and Custom date ranges.
  - Comparative Analysis: Live variance metrics ($\Delta\text{AED}$ and $\Delta\%$) comparing against previous periods.
  - Account Drill-Down & one-click CSV export / PDF print.
- **Balance Sheet (`/finance/reports?tab=balance-sheet`)**:
  - Assets vs. Liabilities & Owner Equity with balance audit indicators.
- **Trial Balance (`/finance/reports?tab=trial-balance`)**:
  - Net Debit and Credit ledger balances grouped by account classification.
- **Accounts Receivable (A/R) Aging Report (`/finance/reports?tab=receivables`)**:
  - Standard aging brackets: `Current (0–30d)`, `31–60d`, `61–90d`, `90+d (Overdue)`.
- **Accounts Payable (A/P) Aging Report (`/finance/reports?tab=payables`)**:
  - Supplier aging analysis with vendor TRN and payment schedules.
- **General Ledger (`/finance/reports?tab=ledger`)**:
  - Account-by-account transaction audit logs with running balances.
- **UAE VAT Returns & Tax Position (`/finance/reports?tab=vat-summary`)**:
  - Live calculation of FTA Form 201: **Output VAT 5%** (Box 1a), **Input VAT 5%** (Box 9), and **Net VAT Due / Recoverable**.

---

### 4. 👥 Human Capital & Workforce Operations (`/operations`)

- **Employee Master Directory (`/operations/employees`)**:
  - UAE labor compliance, Emirates ID tracking, visa expiries, and WPS bank details (IBAN/CBUAE SIF ready).
- **Daily Attendance & Timesheets (`/operations/attendance`)**:
  - Timestamps, working hours, overtime tracking, site notes, and `Mark All Present` batch actions.
- **Leave Management (`/operations/leaves`)**:
  - Annual, Sick, Unpaid, and Emergency leave balances.
- **Bonuses & Performance Incentives (`/operations/bonuses`)**:
  - Performance bonus approvals and payout logs.
- **Fixed Asset Management (`/operations/fixed-assets`)**:
  - Tools, vehicles, and equipment registry with straight-line depreciation schedules.

---

### 5. 🛡️ Role-Based Access Control & Administration (`/administration`)

- **User & Role Management (`/administration/users`)**:
  - JWT authentication with refresh token rotation and activity tracking.
  - Roles: `SUPER_ADMIN`, `ADMIN`, `ACCOUNTANT`, `HR`, `INVENTORY_MANAGER`, and `USER`.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
- **Frontend Library**: [React 19](https://react.dev/)
- **Database & ORM**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **State & Server Cache**: [@tanstack/react-query](https://tanstack.com/query) v5
- **Data Tables & Forms**: [@tanstack/react-table](https://tanstack.com/table) v8 & [@tanstack/react-form](https://tanstack.com/form)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with AGM Design System tokens (Forest Green, Navy, Charcoal, Warm Ivory `#f6f5f0`)
- **Code Quality**: [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.18.0 or later
- **pnpm**: v9 or later (or npm / yarn)
- **PostgreSQL**: Running locally or via Docker / Neon / Supabase

### 1. Install Dependencies & Generate Prisma Client

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
npx prisma generate --no-engine
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/agm_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Run the Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` to access the AGM ERP platform.

---

## 📄 License & Ownership

Designed and maintained for **AGM Aesthetic House Fitout Technical Services L.L.C**, Dubai, United Arab Emirates. All rights reserved.
