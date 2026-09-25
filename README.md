<p align="center">
  <img src="public/assets/logo.png" alt="AGM Aesthetic House Logo" width="220" />
</p>

<h1 align="center">AGM Aesthetic House ERP & Financial Management System</h1>

<p align="center">
  <strong>Enterprise-grade ERP, Double-Entry Accounting, Commercial Vouchers Engine, Engineering & Statutory Documents, Project Cost Tracking, Inventory & Operations Platform</strong><br>
  Custom engineered for <em>AGM Aesthetic House Fitout Technical Services L.L.C</em> (Dubai, UAE)
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.4-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Prisma-6.13-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/OpenAPI-Swagger-85EA2D?style=flat-square&logo=swagger" alt="Swagger" />
</p>

---

## 📋 Table of Contents

- [Key Modules & Capabilities](#-key-modules--capabilities)
  - [1. Commercial Vouchers & Procurement Engine (`/commercial`)](#1--commercial-vouchers--procurement-engine-commercial)
  - [2. Engineering, Safety & Corporate Documents (`/commercial/*`)](#2--engineering-safety--corporate-documents-commercial)
  - [3. Financial Accounting & General Ledger (`/finance`)](#3--financial-accounting--general-ledger-finance)
  - [4. Financial Reports & UAE Statutory Compliance (`/finance/reports` & `/reports`)](#4--financial-reports--uae-statutory-compliance-financereports--reports)
  - [5. Project Management & Real-Time Cost Tracking (`/operations/projects` & `/operations/cost-tracking`)](#5--project-management--real-time-cost-tracking-operationsprojects--operationscost-tracking)
  - [6. Inventory & Supply Chain Management (`/inventory`)](#6--inventory--supply-chain-management-inventory)
  - [7. Human Capital & Workforce Operations (`/operations`)](#7--human-capital--workforce-operations-operations)
  - [8. Role-Based Access Control & Security (`/administration`)](#8--role-based-access-control--security-administration)
- [Double-Entry Accounting Reference](#-double-entry-accounting-reference)
- [Interactive API Documentation (Swagger)](#-interactive-api-documentation-swagger)
- [Project Architecture & Directory Structure](#-project-architecture--directory-structure)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Environment Configuration](#environment-configuration)
  - [Database Operations](#database-operations)
  - [Development Scripts](#development-scripts)
- [License & Ownership](#-license--ownership)

---

## 🌟 Key Modules & Capabilities

### 1. 📑 Commercial Vouchers & Procurement Engine (`/commercial`)

Transforms commercial transactions into an end-to-end connected pipeline spanning Sales, Purchasing, Physical Inventory Movements, and Automated Double-Entry General Ledger (GL) posting.

#### **A. Sales Transaction Pipeline**

$$\text{Quotation} \longrightarrow \text{Sales Order} \longrightarrow \text{Sales Invoice} \longrightarrow \text{Customer Payment} \longrightarrow \text{Credit Note}$$

- **Commercial Quotations (`/commercial/quotations` & `/finance/quotations`)**:
  - Multi-line Bill of Quantities (BOQ) scope builder with live product catalog search and unit pricing.
  - Dynamic 5% UAE VAT calculation, line-item discounts, structured payment terms/milestones, and official A4 PDF print layouts.
  - One-click **"Convert to Sales Order"** upon customer sign-off.
- **Sales Orders & Contracts (`/commercial/sales-orders`)**:
  - Tracks client project scope, expected delivery milestones, and order pipelines (`DRAFT`, `CONFIRMED`, `PROCESSING`, `COMPLETED`, `CANCELLED`).
  - One-click **"Convert to Sales Invoice"**.
- **Sales Invoices & Tax Billing (`/commercial/sales-invoices`)**:
  - UAE FTA-compliant tax invoices with TRN tracking, 5% Output VAT calculation, and printable invoice documents.
  - **Automated Double-Entry Posting**: One-click **"Post to GL"** generates balanced journal entries:
    - `Dr. Accounts Receivable (1200)`
    - `Cr. Sales Revenue / Service Income (4000)`
    - `Cr. VAT Output Tax Payable (2210)`
- **Customer Payments & Receipts (`/commercial/customer-payments`)**:
  - Records receipts across payment channels (Bank Transfer, Cheque, Cash, Card).
  - Automatically reconciles invoice outstanding balances and creates printable payment receipts.
  - Automated GL posting: `Dr. Bank / Cash`, `Cr. Accounts Receivable`.
- **Sales Returns & Credit Notes (`/commercial/credit-notes`)**:
  - Issues credit notes for project scope adjustments or material returns.
  - Automatically reverses Accounts Receivable and Output VAT liabilities with journal entries.

---

#### **B. Purchasing & Procurement Pipeline**

$$\text{Purchase Request} \longrightarrow \text{Purchase Order} \longrightarrow \text{Goods Received (GRN)} \longrightarrow \text{Supplier Bill} \longrightarrow \text{Supplier Payment} \longrightarrow \text{Debit Note}$$

- **Purchase Requests & Requisitions (`/commercial/purchase-requests`)**:
  - Site team material requisitions, required-by dates, priority levels, and department approval workflows (`DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `CONVERTED`).
  - One-click **"Convert to Purchase Order"**.
- **Purchase Orders (`/commercial/purchase-orders` & `/inventory/purchase-orders`)**:
  - Supplier procurement orders, vendor reference numbers, unit pricing lines, payment terms, and status tracking (`DRAFT`, `ORDERED`, `PARTIALLY_RECEIVED`, `RECEIVED`).
- **Goods Received Notes - GRN (`/commercial/goods-received`)**:
  - Logs supplier deliveries against open Purchase Orders with warehouse facility routing.
  - Tracks accepted vs. damaged quantities and **automatically increments physical warehouse stock on hand** via `PURCHASE_IN` stock movements.
- **Supplier Bills & Accounts Payable (`/commercial/supplier-bills`)**:
  - Vendor tax bills, 5% Input VAT recovery, and automated AP posting:
    - `Dr. Purchase Materials / Direct Cost (5010)`
    - `Dr. VAT Input Tax Payable (2200)`
    - `Cr. Accounts Payable (2000)`
- **Supplier Payments & Disbursals (`/commercial/supplier-payments`)**:
  - Disburses payments to vendors via RAK Bank or Cheque, clearing open bills (`Dr. Accounts Payable`, `Cr. Bank / Cash`).
- **Purchase Returns & Debit Notes (`/commercial/debit-notes`)**:
  - Issues debit notes for rejected or damaged shipments, automatically deducting Accounts Payable liabilities.

---

### 2. 📜 Engineering, Safety & Corporate Documents (`/commercial/*`)

Specialized fit-out and engineering document generators with customizable templates, signature controls, and official print-ready formats:

- **Method Statements (`/commercial/method-statements`)**:
  - Comprehensive technical fit-out method statements with scope descriptions, sequential installation procedures, required tools/plant, safety PPE, quality check controls, and emergency protocols.
- **Risk Assessments (`/commercial/risk-assessments`)**:
  - HSE hazard identification matrix evaluating probability, severity, and risk scores before and after mitigation controls. Compliant with UAE municipality and civil defense standards.
- **Company Agreements (`/commercial/agreements`)**:
  - Subcontractor agreements, project supply contracts, and confidentiality agreements with structured clauses, scope definitions, and execution signatures.
- **Salary Certificates (`/commercial/salary-certificates`)**:
  - Official UAE salary certificates for banking, embassy visa, or tenancy purposes with basic pay, allowances, and authorized signatory blocks.
- **Custom Letters & Certificates (`/commercial/custom-letters`)**:
  - Formal letterhead communications, experience certificates, NOCs (No Objection Certificates), and site clearance notices.

---

### 3. 💼 Financial Accounting & General Ledger (`/finance`)

- **Interactive Executive Dashboard (`/dashboard`)**:
  - Real-time revenue metrics, gross/net margins, asset balances, and WPS workforce statistics.
  - Toggle between **Profit & Loss** and **Cash Flow** analytics views with quick period filters (_This Month_, _This Quarter_, _This Year_, or _Custom date range_).
- **Chart of Accounts (`/finance/accounts`)**:
  - Full double-entry general ledger with hierarchical parent-child groupings across `ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, and `EXPENSE`.
- **General Journal Entries (`/finance/journal-entries`)**:
  - Standardized double-entry transaction posting, draft/posted controls, and strict debit/credit balance integrity validation.
- **Operational Expenses (`/finance/expenses`)**:
  - Tracks company operating expenses, tax deductions, payment account linkages, and receipt attachments.

---

### 4. 📊 Financial Reports & UAE Statutory Compliance (`/finance/reports` & `/reports`)

- **Executive Financial Summary (`/finance/reports?tab=summary`)**:
  - High-level KPIs, working capital, liquidity ratios, and audit balance integrity checks.
- **Statement of Profit & Loss (`/finance/reports?tab=profit-loss`)**:
  - Dynamic Period Reporting: Daily, Weekly, Monthly, Yearly (Fiscal), and Custom date ranges.
  - Comparative Analysis: Live variance metrics ($\Delta\text{AED}$ and $\Delta\%$) comparing against prior periods.
  - Account drill-down with one-click CSV export and print-ready formatting.
- **Balance Sheet (`/finance/reports?tab=balance-sheet`)**:
  - Assets vs. Liabilities & Owner Equity with balance audit indicators.
- **Trial Balance (`/finance/reports?tab=trial-balance`)**:
  - Net Debit and Credit ledger balances grouped by account classification.
- **Accounts Receivable (A/R) Aging (`/finance/reports?tab=receivables`)**:
  - Aging buckets: `Current (0–30d)`, `31–60d`, `61–90d`, `90+d (Overdue)`.
- **Accounts Payable (A/P) Aging (`/finance/reports?tab=payables`)**:
  - Supplier aging analysis with vendor TRN and scheduled payment obligations.
- **General Ledger (`/finance/reports?tab=ledger`)**:
  - Account-by-account transaction audit trail with running balances.
- **UAE VAT Returns & Tax Position (`/finance/reports?tab=vat-summary` & `/reports/vat`)**:
  - Live calculation of **FTA Form 201**:
    - **Box 1a**: Standard Rated Supplies (Output VAT 5%)
    - **Box 9**: Standard Rated Expenses (Input VAT 5% Recoverable)
    - **Box 12**: Net VAT Payable / (Recoverable)
- **Domain Reports Suite (`/reports`)**:
  - Dedicated operational reports for Sales (`/reports/sales`), Purchases (`/reports/purchases`), Customers (`/reports/customers`), Suppliers (`/reports/suppliers`), Expenses (`/reports/expenses`), and Management KPIs (`/reports/management`).

---

### 5. 🏗️ Project Management & Real-Time Cost Tracking (`/operations/projects` & `/operations/cost-tracking`)

Designed specifically for commercial interior fit-out projects and contracting management:

- **Project Master Registry (`/projects` & `/operations/projects`)**:
  - Client project registry with start/end timelines, contract values, project statuses (`PLANNING`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, `CANCELLED`), and location details.
  - Milestone delivery tracking with percentage completion and progress monitoring.
- **Real-Time Project Cost Tracking (`/operations/cost-tracking`)**:
  - Live variance analysis comparing **Estimated Budget vs. Actual Incurred Costs**.
  - Granular cost categorization:
    - `MATERIALS`: Direct materials, joinery, and fittings.
    - `LABOR`: Direct site workforce and technician hours.
    - `SUBCONTRACTOR`: MEP, glass, flooring, and specialized subcontractor invoices.
    - `EQUITY / EQUIPMENT`: Scaffolding, machinery rental, and transport.
    - `OVERHEAD`: Site utilities, municipality permits, and logistical expenses.
  - Detailed cost entry ledger with search, category filtering, and instant budget margin impact calculations.

---

### 6. 📦 Inventory & Supply Chain Management (`/inventory`)

- **Stock Level Overview (`/inventory/products`)**:
  - Real-time stock levels with automatic color-coded reorder alerts (`Low Stock`, `Out of Stock`).
- **Warehouse Transfers & Adjustments (`/inventory/stock-movements`)**:
  - Complete historical movement audit trail: `PURCHASE_IN`, `SALE_OUT`, `ADJUSTMENT_IN`, `ADJUSTMENT_OUT`, `TRANSFER_IN`, `TRANSFER_OUT`, `RETURN_IN`, `RETURN_OUT`, and `PROJECT_CONSUMPTION`.
- **Sales & Purchase Returns (`/inventory/sales-returns` & `/inventory/purchase-returns`)**:
  - Physical goods return logging synchronized with financial Credit & Debit notes.
- **Master Directories**:
  - **Customer Master (`/commercial/customers`)**: Complete client database with credit limits, TRN numbers, and live Statement of Account ledgers.
  - **Suppliers & Vendors (`/inventory/suppliers`)**: Vendor records with payment terms, contact details, and procurement histories.
  - **Warehouses & Facilities (`/inventory/warehouses`)**: Multi-facility location tracking.

---

### 7. 👥 Human Capital & Workforce Operations (`/operations`)

- **Employee Master Directory (`/operations/employees`)**:
  - UAE Labor Law compliance: Emirates ID, Passport, Labor Card, and Visa expiry tracking with alert thresholds.
  - WPS compliance ready: Bank details, IBAN, and Central Bank of the UAE SIF file fields.
- **Daily Attendance & Timesheets (`/operations/attendance`)**:
  - Timestamps, check-in/out records, working hours, overtime calculations, late-minute deductions, and `Mark All Present` batch actions.
- **Leave Management (`/operations/leaves`)**:
  - Annual (30-day UAE statutory), Sick, Unpaid, Emergency, and Maternity leaves with multi-stage approval workflows.
- **Bonuses & Performance Incentives (`/operations/bonuses`)**:
  - Performance, festival, project completion, and attendance bonus approvals.
  - Linkage to payroll accounts and disbursement tracking.
- **Fixed Asset Management (`/operations/fixed-assets`)**:
  - Registry for vehicles, site tools, heavy machinery, office equipment, and furniture.
  - Automated straight-line depreciation schedules linked to Chart of Accounts.

---

### 8. 🛡️ Role-Based Access Control & Security (`/administration`)

- **Granular RBAC Hierarchy**:
  - `SUPER_ADMIN`: Unrestricted global system access, audit logs, and user role assignment.
  - `ADMIN`: Full operational and administrative access.
  - `MANAGER`: Project supervision, approvals, and cost tracking.
  - `ACCOUNTANT`: Finance, journal entries, commercial vouchers, billing, and tax reports.
  - `HR`: Workforce management, attendance, leaves, bonuses, and payroll.
  - `INVENTORY_MANAGER`: Products, warehouse stock, GRN, and procurement.
  - `USER`: Read-only or restricted access to specific assigned workspaces.
- **Authentication**:
  - Dual-token JWT architecture (Short-lived Access Token in HTTP-only cookies/headers + Database-persisted Refresh Token rotation).
  - Protected API routes and route-guard middleware ([`middleware.ts`](middleware.ts)).

---

## ⚖️ Double-Entry Accounting Reference

The system enforces balanced accounting entries for all commercial vouchers:

| Commercial Event       | Voucher Type       | Debit Account                                    | Credit Account                                   |
| :--------------------- | :----------------- | :----------------------------------------------- | :----------------------------------------------- |
| **Sales Invoice**      | Commercial Billing | Accounts Receivable (`1200`)                     | Service Income (`4000`) & Output VAT (`2210`)    |
| **Customer Receipt**   | Customer Payment   | RAK Bank (`1020`) / Cash (`1010`)                | Accounts Receivable (`1200`)                     |
| **Credit Note**        | Sales Return       | Service Income (`4000`) & Output VAT (`2210`)    | Accounts Receivable (`1200`)                     |
| **Supplier Bill**      | AP Procurement     | Purchase Materials (`5010`) & Input VAT (`2200`) | Accounts Payable (`2000`)                        |
| **Supplier Payment**   | AP Disbursal       | Accounts Payable (`2000`)                        | RAK Bank (`1020`) / Cash (`1010`)                |
| **Debit Note**         | Purchase Return    | Accounts Payable (`2000`)                        | Purchase Materials (`5010`) & Input VAT (`2200`) |
| **Asset Depreciation** | Fixed Asset        | Depreciation Expense (`5xxx`)                    | Accumulated Depreciation (`1xxx`)                |

---

## 📖 Interactive API Documentation (Swagger)

The project includes built-in OpenAPI/Swagger specification generation:

- **Interactive Swagger UI**: Visit `http://localhost:3000/docs` to test all API endpoints directly in the browser.
- **OpenAPI JSON Spec**: Available at `http://localhost:3000/api/doc`.

---

## 🏗️ Project Architecture & Directory Structure

```text
agm/
├── app/
│   ├── (auth)/                     # Unauthenticated auth routes (login, signup)
│   ├── (workspace)/                # Authenticated application shell
│   │   ├── administration/users/   # User provisioning & role management
│   │   ├── commercial/             # Quotations, Sales Orders, Invoices, GRN, Bills, Technical Docs
│   │   ├── dashboard/              # Executive KPI & Cash Flow dashboard
│   │   ├── finance/                # Chart of Accounts, Journals, Reports
│   │   ├── inventory/              # Products, Warehouses, Stock Movements
│   │   ├── operations/             # Projects, Cost Tracking, Employees, Attendance, Leaves, Fixed Assets
│   │   ├── projects/               # Project management shortcut route
│   │   └── reports/                # Dedicated operational and tax reporting
│   ├── api/                        # Next.js Route Handlers (REST API)
│   │   ├── accounts/               # Chart of accounts endpoints
│   │   ├── assets/                 # Fixed asset registry & depreciation endpoints
│   │   ├── auth/                   # Login, register, refresh, logout
│   │   ├── commercial/             # Commercial vouchers, technical docs CRUD & GL posting
│   │   ├── doc/                    # Swagger JSON generator
│   │   ├── employees/              # HR, attendance, leaves, bonuses
│   │   ├── finance/                # Journal entries & accounting logic
│   │   ├── inventory/              # Products, stock, warehouses, suppliers
│   │   ├── projects/               # Projects, milestones, and cost tracking endpoints
│   │   ├── reports/                # Financial statements (P&L, BS, Aging, VAT)
│   │   └── users/                  # User management & RBAC endpoints
│   ├── docs/                       # Swagger UI documentation viewer
│   ├── globals.css                 # Tailwind CSS v4 design tokens & print rules
│   └── layout.tsx                  # Root layout & query client provider
├── components/
│   ├── layout/WorkspaceLayout.tsx  # Workspace shell with topbar & responsive sidebar
│   ├── documents/                  # Method statement, Risk assessment, Salary certificate templates
│   ├── quotation/                  # Modular quotation & sales invoice builder components
│   ├── ui/                         # Reusable UI primitives (Button, Table, FormControls, DatePicker)
│   ├── GlobalCreateMenu.tsx        # Fast-action modal for creating vouchers & records
│   ├── Sidebar.tsx                 # Navigation sidebar with role-aware items
│   ├── StatCard.tsx                # KPI statistic cards with sparkline & delta metrics
│   ├── PrintLayout.tsx             # Printable document wrapper
│   ├── BarChart.tsx                # Chart.js bar chart component
│   └── DoughnutChart.tsx           # Chart.js doughnut chart component
├── context/
│   └── AuthContext.tsx             # Client authentication state & user profile
├── lib/
│   ├── api-client.ts               # Authenticated client-side fetch client
│   ├── auth-server.ts              # Server-side token validation & RBAC guards
│   ├── auth-service.ts             # Browser token storage & session manager
│   ├── commercial-accounting.ts    # Automated GL posting engine
│   ├── hooks/                      # Centralized TanStack Query hooks library (commercial, finance, projects, HR)
│   ├── jwt.ts                      # JWT signing & verification utilities
│   ├── navigation.ts               # Routing map & page metadata dictionary
│   ├── prisma.ts                   # Prisma client singleton with Postgres adapter
│   └── swagger.ts                  # OpenAPI definition schemas
├── prisma/
│   ├── migrations/                 # PostgreSQL schema migrations
│   └── schema.prisma               # Complete database schema definition
├── docker-compose.yml              # PostgreSQL 16 Alpine local database container
├── middleware.ts                   # Edge route protection & token inspection
├── next.config.ts                  # Next.js configuration & API proxy rewrites
└── package.json                    # Project dependencies & scripts
```

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15.4](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
- **Frontend Library**: [React 19.1](https://react.dev/)
- **Database & ORM**: PostgreSQL 16 with [Prisma ORM 6.13](https://www.prisma.io/) via `@prisma/adapter-pg`
- **State & Server Cache**: [@tanstack/react-query v5](https://tanstack.com/query)
- **Data Tables & Forms**: [@tanstack/react-table v8](https://tanstack.com/table) & [@tanstack/react-form](https://tanstack.com/form)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with AGM Design System tokens (Forest Green, Navy, Charcoal, Warm Ivory `#f6f5f0`)
- **Visualizations**: [Chart.js](https://www.chartjs.org/) & [react-chartjs-2](https://react-chartjs-2.js.org/)
- **Code Quality**: [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.18.0 or later
- **pnpm**: v9 or later (recommended; or `npm` / `yarn`)
- **PostgreSQL**: v15+ (local, Docker, Supabase, or Neon)

---

### Installation & Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Rahmankhattak711/agm.git
   cd agm
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Start PostgreSQL with Docker (Optional)**:
   If you do not have a local PostgreSQL instance running:
   ```bash
   docker compose up -d
   ```

---

### Environment Configuration

Create a `.env` file in the root directory:

```env
# PostgreSQL Database URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agm_db?schema=public"

# JWT Authentication Secrets
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Application Base URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Upstream API Proxy target (if using microservices)
# API_PROXY_URL="http://backend-service:8080"
```

---

### Database Operations

```bash
# Generate Prisma Client with custom config
pnpm run prisma:generate

# Run migrations against the database
pnpm run prisma:migrate

# Open Prisma Studio web inspector
pnpm run prisma:studio
```

---

### Development Scripts

| Command                    | Description                                                  |
| :------------------------- | :----------------------------------------------------------- |
| `pnpm dev`                 | Starts Next.js development server at `http://localhost:3000` |
| `pnpm build`               | Generates Prisma client and builds production Next.js bundle |
| `pnpm start`               | Runs the production-built application                        |
| `pnpm lint`                | Runs ESLint checks across the codebase                       |
| `pnpm format`              | Formats all files with Prettier                              |
| `pnpm format:check`        | Checks code formatting without modifying files               |
| `pnpm run prisma:generate` | Regenerates Prisma Client based on `prisma/schema.prisma`    |
| `pnpm run prisma:migrate`  | Applies pending database migrations in development           |
| `pnpm run prisma:studio`   | Launches Prisma Studio GUI at `http://localhost:5555`        |

---

## 📄 License & Ownership

Designed and maintained for **AGM Aesthetic House Fitout Technical Services L.L.C**, Dubai, United Arab Emirates. All rights reserved.
