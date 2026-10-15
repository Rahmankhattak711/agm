<div align="center">
  <img src="./public/assets/logo.png" alt="AGM Logo" width="220" />

  <h1>AGM ERP & Financial Management Platform</h1>

  <p>
    An enterprise-grade Resource Planning (ERP), Fitout Contracting, and Double-Entry Financial Management platform custom-engineered for <strong>AGM Aesthetic House Fitout Technical Services L.L.C</strong> (Dubai, United Arab Emirates).
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-15.4-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19.1-blue?style=for-the-badge&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Prisma-6.13-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/UAE%20VAT-5%25%20Compliant-00732f?style=for-the-badge" alt="UAE VAT" />
  </p>
</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Architecture & Tech Stack](#-system-architecture--tech-stack)
- [Repository Structure](#-repository-structure)
- [Core Functional Modules](#-core-functional-modules)
  - [1. Commercial & Sales](#1-commercial--sales)
  - [2. Procurement & Supply Chain](#2-procurement--supply-chain)
  - [3. Inventory & Multi-Warehouse](#3-inventory--multi-warehouse)
  - [4. Financial Accounting & General Ledger](#4-financial-accounting--general-ledger)
  - [5. Projects & Fitout Cost Tracking](#5-projects--fitout-cost-tracking)
  - [6. HR, Attendance & Payroll](#6-hr-attendance--payroll)
  - [7. Fixed Assets & Depreciation](#7-fixed-assets--depreciation)
  - [8. Engineering & Corporate Documents Engine](#8-engineering--corporate-documents-engine)
  - [9. Administration & Role-Based Access Control](#9-administration--role-based-access-control)
- [Automated Accounting & Double-Entry Workflows](#-automated-accounting--double-entry-workflows)
- [Role-Based Access Control (RBAC) Matrix](#-role-based-access-control-rbac-matrix)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Installation](#local-installation)
  - [Docker PostgreSQL Setup](#docker-postgresql-setup)
  - [Environment Configuration](#environment-configuration)
  - [Database Migration & Seeding](#database-migration--seeding)
  - [Running the Application](#running-the-application)
- [Environment Variables Reference](#-environment-variables-reference)
- [Available Scripts](#-available-scripts)
- [API Documentation (Swagger / OpenAPI)](#-api-documentation-swagger--openapi)
- [Security & Authentication Model](#-security--authentication-model)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [License & Company Notice](#-license--company-notice)

---

## 🏢 Overview

**AGM ERP** is an end-to-end business management system tailored for the luxury commercial, residential, and corporate fitout contracting industry in the UAE.

The application bridges site engineering and commercial execution with strict financial accounting:

- **Commercial Pipeline**: Quotations with dynamic area (SQM) calculators, Sales Orders, Tax Invoices (UAE FTA 5% VAT compliant), Customer Receipts, and real-time Statement of Account (SOA).
- **Supply Chain**: Purchase requisitions, Vendor Purchase Orders, Goods Receipt Notes (GRN) with warehouse inspection, and Supplier Bills.
- **Automated Double-Entry Ledger**: Real-time journal entry generation upon invoice, payment, bill, or debit/credit note posting.
- **UAE Regulatory Compliance**: Federal Tax Authority (FTA) 5% VAT handling, WPS bank transfer metadata, and Emirates ID / Visa expiration tracking.
- **Contracting & HSE Documents**: Automated PDF and print-ready generators for Fitout Agreements, Method Statements, Risk Assessments, and Salary Certificates.

---

## 🛠️ System Architecture & Tech Stack

| Layer                         | Technologies                                                                                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework & Runtime**       | [Next.js 15](https://nextjs.org/) (App Router, Server-side rendering, Edge-ready route handlers), [Node.js](https://nodejs.org/) (v20+ recommended), [TypeScript 5.8](https://www.typescriptlang.org/)                                |
| **Frontend & UI**             | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/) (modern `@theme` CSS configuration), [Framer Motion](https://www.framer.com/motion/) for micro-interactions, [Lucide React](https://lucide.dev/) icons    |
| **State & Data Table**        | [TanStack React Query v5](https://tanstack.com/query) (server state caching & revalidation), [TanStack React Table v8](https://tanstack.com/table) (sorting, pagination, filtering), [TanStack React Form](https://tanstack.com/form) |
| **Database & ORM**            | [PostgreSQL 16](https://www.postgresql.org/) with [Prisma ORM 6.13](https://www.prisma.io/) (`@prisma/client`, `@prisma/adapter-pg`)                                                                                                  |
| **Authentication & Security** | Stateless JWT Access Tokens ([`jose`](https://github.com/panva/jose)), HttpOnly Refresh Token Cookies, cryptographic hash rotation with token families, bcrypt password hashing, account lockout protection                           |
| **Document Generation**       | [React-to-Print](https://github.com/gregnb/react-to-print) with pixel-accurate CSS print stylesheets and corporate header/footer layouts                                                                                              |
| **Charts & Analytics**        | [Chart.js 4](https://www.chartjs.org/) & [React-Chartjs-2](https://react-chartjs-2.js.org/)                                                                                                                                           |
| **API Specification**         | [Swagger UI React](https://swagger.io/tools/swagger-ui/) & [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) (OpenAPI 3.0 specification at `/docs`)                                                                            |
| **Testing & Tooling**         | [Vitest 5](https://vitest.dev/), [ESLint 9](https://eslint.org/), [Prettier 3](https://prettier.io/)                                                                                                                                  |

---

## 📂 Repository Structure

```plaintext
agm/
├── app/
│   ├── (auth)/                     # Public authentication routes
│   │   ├── login/                  # User login page & credential verification
│   │   └── refresh/                # Seamless silent token renewal
│   ├── (workspace)/                # Protected enterprise application workspace
│   │   ├── administration/         # User accounts, roles & session audit
│   │   ├── commercial/             # Quotations, Sales Orders, Tax Invoices, SOA, Letters
│   │   ├── dashboard/              # Executive KPI dashboard & revenue metrics
│   │   ├── finance/                # Chart of Accounts, Journal Entries, Expenses, Reports
│   │   ├── inventory/              # Products, Warehouses, Stock Movements, POs
│   │   ├── operations/             # Projects, Cost Tracking, Employees, Attendance, Fixed Assets
│   │   └── reports/                # Specialized sales, purchase, VAT & management reports
│   ├── api/                        # Next.js App Router REST API endpoints
│   │   ├── accounts/               # Chart of accounts endpoints
│   │   ├── assets/                 # Fixed asset registry & automated depreciation
│   │   ├── auth/                   # Authentication, login, logout, refresh, user session
│   │   ├── commercial/             # Invoices, orders, quotations, agreements, SOA
│   │   ├── cron/                   # Scheduled cleanup and maintenance tasks
│   │   ├── doc/                    # OpenAPI 3.0 JSON specification provider
│   │   ├── employees/              # Workforce, attendance, leave & bonus endpoints
│   │   ├── finance/                # Expenses, quotations & accounting API
│   │   ├── inventory/              # Stock movements, products, warehouse inventory
│   │   ├── journal-entries/        # Double-entry GL journal posting API
│   │   ├── projects/               # Fitout project budget vs actual costing
│   │   ├── reports/                # Financial statements (P&L, Balance Sheet, Aging, VAT)
│   │   └── users/                  # User administration & role modification
│   ├── docs/                       # Swagger UI documentation page (/docs)
│   ├── globals.css                 # Global CSS and Tailwind v4 theme design tokens
│   ├── layout.tsx                  # Root HTML layout & font declarations
│   └── providers.tsx               # TanStack Query & Toast providers
├── components/
│   ├── AgmLogo.tsx                 # Official corporate SVG logo component
│   ├── QuotationTemplate.tsx       # Printable multi-page fitout quotation template
│   ├── Sidebar.tsx                 # Collapsible role-aware multi-tier navigation sidebar
│   ├── documents/                  # Specialized printable engineering & legal documents
│   │   ├── AgreementTemplate.tsx   # Fitout technical services client agreement
│   │   ├── CustomLetterTemplate.tsx# Official company certificate & letterhead
│   │   ├── MethodStatementTemplate.tsx # Technical site execution method statements
│   │   ├── RiskAssessmentTemplate.tsx  # Site HSE risk assessment matrix
│   │   ├── SalaryCertificateTemplate.tsx # Official employee salary certificate
│   │   └── StatementOfAccountDocument.tsx # Customer Statement of Account (SOA)
│   ├── quotation/                  # Quotation builders, tables, terms & calculations
│   └── ui/                         # Reusable UI component library (Button, DataTable, Modal, etc.)
├── context/                        # React context (AuthContext, ConfirmContext)
├── lib/
│   ├── api-client.ts               # Authenticated frontend API fetching wrapper
│   ├── auth/                       # Tokens, cookies, password policy & rate limiting
│   ├── auth-server.ts              # Server-side auth verification & RBAC guards
│   ├── commercial-accounting.ts    # Automated double-entry GL posting engine
│   ├── env.ts                      # Zod-validated environment configuration
│   ├── navigation.ts               # Route mapping, page metadata & breadcrumbs
│   ├── prisma.ts                   # Cached Prisma database client singleton
│   ├── project-invoice-match.ts    # Fitout project budget & invoice reconciliation
│   ├── report-helpers.ts           # Financial statement calculation algorithms
│   └── swagger.ts                  # OpenAPI 3.0 schema definitions
├── prisma/
│   ├── schema.prisma               # Complete PostgreSQL relational database schema
│   ├── seed.ts                     # Initial Super Admin user & reference data seeder
│   └── migrations/                 # Versioned SQL database migrations
├── scripts/
│   ├── cleanup-tokens.ts           # Periodic expired refresh token purge script
│   └── remove-comments.mjs         # Codebase comment sanitation utility
├── tests/
│   ├── auth.test.ts                # Unit tests for passwords, tokens & security policies
│   └── setup.ts                    # Vitest environment setup
├── docker-compose.yml              # Local PostgreSQL 16 container definition
├── middleware.ts                   # Edge-safe JWT route protection & security headers
├── next.config.ts                  # Security headers (CSP, HSTS) & rewrite rules
└── package.json                    # Project dependencies, metadata & scripts
```

---

## ⚡ Core Functional Modules

### 1. Commercial & Sales

- **Customer Directory**: Customer profiles, UAE TRN tax numbers, billing addresses, credit limits, and running outstanding balances.
- **Quotations**: Detailed fitout proposals organized by architectural sections (Civil, Joinery, MEP, Finishes). Includes area calculations (SQM/LM/PCS), custom discounts, UAE 5% VAT computation, and payment terms.
- **Sales Orders**: Conversion of approved quotations into firm production/execution orders.
- **Tax Invoices**: VAT-compliant tax invoices with automatic sequence numbering (`INV-YYYY-XXXX`). Posting an invoice automatically generates double-entry journal records (Debit Accounts Receivable, Credit Revenue, Credit Output VAT).
- **Customer Payments & Receipts**: Multi-channel receipts (Bank Transfer, Cash, Cheque, Card) linked to customer invoices, with automatic Accounts Receivable balance relief.
- **Credit Notes**: Sales returns and value adjustments with corresponding VAT reversals and GL postings.
- **Statement of Account (SOA)**: Real-time chronological audit trail for any customer within a date window, displaying opening balance, invoiced amounts, received payments, credit notes, and net balance with print/PDF export.

### 2. Procurement & Supply Chain

- **Purchase Requests (PR)**: Internal site requisition workflow for tools, consumables, and fitout raw materials with manager approval states.
- **Purchase Orders (PO)**: Vendor purchase contracts with unit costs, expected delivery schedules, and vendor references.
- **Goods Receipt Notes (GRN)**: Formal warehouse/site delivery verification tracking quantities received, quantities accepted, and damaged items against POs.
- **Supplier Bills (AP Invoices)**: Recording vendor invoices with automatic posting to Accounts Payable and Input VAT tax ledgers.
- **Supplier Payments**: Settlement of vendor liabilities via corporate bank accounts (RAK Bank) or cash on hand.
- **Debit Notes**: Vendor purchase returns and debit adjustments with automatic AP and input tax adjustments.

### 3. Inventory & Multi-Warehouse

- **Product Catalog**: Multi-category stock registry supporting Raw Materials, Finished Goods, Consumables, and Tools/Equipment.
- **Stock Movement Ledger**: Complete audit trail of inventory transactions: `PURCHASE_IN`, `SALE_OUT`, `TRANSFER_IN/OUT`, `RETURN_IN/OUT`, `ADJUSTMENT`, and `PROJECT_CONSUMPTION`.
- **Multi-Warehouse Stock**: Real-time stock on hand (SOH) across primary warehouses and project site locations with minimum reorder level alerts.

### 4. Financial Accounting & General Ledger

- **Chart of Accounts (COA)**: Five-category standard chart of accounts:
  - `ASSET` (1000s: Cash, Bank, Accounts Receivable, Inventory, Fixed Assets)
  - `LIABILITY` (2000s: Accounts Payable, VAT Payable, Accruals)
  - `EQUITY` (3000s: Retained Earnings, Owner's Capital)
  - `REVENUE` (4000s: Service Income, Fitout Contracting Revenue)
  - `EXPENSE` (5000s: Purchase Materials, Subcontractor Costs, Labor, Depreciation)
- **Manual & Automated Journal Entries**: Strict debit/credit equality validation, reference tracking, and support for multi-line compound transactions.
- **Financial Reporting Suite**:
  - **Profit & Loss (Income Statement)**: Net revenue, cost of goods sold (COGS), gross margin, operating expenses, and net profit.
  - **Balance Sheet**: Comprehensive snapshot of Assets = Liabilities + Equity.
  - **Trial Balance**: Verification of total debit vs. credit balance equality.
  - **Aging Reports**: Accounts Receivable (AR) & Accounts Payable (AP) aging buckets (0-30, 31-60, 61-90, 90+ days).
  - **General Ledger Book**: Drill-down account ledger with beginning balance, transaction stream, and ending balance.
  - **UAE VAT 201 Report**: Detailed output VAT collected, input VAT paid, and net VAT payable/refundable to the Federal Tax Authority.

### 5. Projects & Fitout Cost Tracking

- **Project Lifecycle**: Complete tracking from `PLANNING`, `IN_PROGRESS`, `ON_HOLD`, to `COMPLETED`.
- **Budget vs. Actual Cost Breakdown**: Real-time comparison of contract value against granular cost categories:
  - Materials (`MATERIAL`)
  - Labor (`LABOR`)
  - Subcontractors (`SUBCONTRACTOR`)
  - Equipment, Permits, Transport & Overheads
- **Milestone Management**: Project phase tracking with target deadlines, percentage completion, and progress billing.

### 6. HR, Attendance & Payroll

- **Employee Master Records**: Full demographic information, Emirates ID & expiry, Passport & expiry, Visa & Labor card status, and reporting hierarchies.
- **Daily Attendance**: Site and office check-in/out tracking with status types (`PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`, `ON_LEAVE`, `HOLIDAY`), late minute counters, and overtime calculation.
- **Leave Management**: Leave requests (`ANNUAL`, `SICK`, `UNPAID`, `EMERGENCY`), multi-tier approval workflow, and automated leave balance deductions.
- **Bonuses & Deductions**: Performance, festive, and project-completion bonuses with approval tracking.
- **WPS Payroll Support**: Basic salary, housing, and transport allowances with WPS-compliant bank and IBAN fields.

### 7. Fixed Assets & Depreciation

- **Fixed Asset Register**: Vehicles, machinery, office equipment, computers, and leasehold improvements.
- **Vehicle Fleet Metadata**: Registration numbers, chassis numbers, plate numbers, and assigned drivers.
- **Automated Depreciation**: Straight-line / reducing rate calculations generating automated year-end depreciation schedules and GL journal postings (`Depreciation Expense` vs. `Accumulated Depreciation`).

### 8. Engineering & Corporate Documents Engine

Pixel-perfect, print-optimized document generators compliant with Dubai Municipality and UAE contracting standards:

- **Commercial Fitout Agreements**: Complete legal contracts with contractor & client data, property details, payment milestone schedules, client-supplied materials, and signature/stamp sections.
- **Method Statements**: Comprehensive engineering execution procedures covering site safety, PPE requirements, tools, and technical methodologies.
- **Risk Assessments**: Formal Health, Safety, and Environment (HSE) risk assessment matrices evaluating hazard likelihood, severity, and mitigation controls.
- **Salary Certificates**: Official UAE salary certificates for banking, visa, and legal purposes with authorized signatory stamps.
- **Custom Corporate Letters**: Official letterheads for formal client and governmental correspondence.

### 9. Administration & Role-Based Access Control

- **User Management**: Create, update, deactivate, and assign roles to enterprise users.
- **Role Permissions**: Granular authorization across modules.
- **Audit Logging**: System audit log recording actor, action, target entity, timestamp, and IP address.

---

## 🔄 Automated Accounting & Double-Entry Workflows

Every commercial and operational transaction seamlessly updates the general ledger through `lib/commercial-accounting.ts`:

```mermaid
flowchart LR
    subgraph Commercial [Sales Cycle]
        Q[Quotation] --> SO[Sales Order]
        SO --> SI[Sales Invoice]
        SI -- "Post Invoice" --> JE1["Journal Entry<br/>Dr. Accounts Receivable (1200)<br/>Cr. Service Income (4000)<br/>Cr. VAT Output Payable (2210)"]
        SI --> CP[Customer Payment]
        CP -- "Post Receipt" --> JE2["Journal Entry<br/>Dr. Bank / Cash (1020/1010)<br/>Cr. Accounts Receivable (1200)"]
    end

    subgraph Procurement [Purchase Cycle]
        PR[Purchase Request] --> PO[Purchase Order]
        PO --> GRN[Goods Receipt]
        GRN --> SB[Supplier Bill]
        SB -- "Post Bill" --> JE3["Journal Entry<br/>Dr. Purchase Materials (5010)<br/>Dr. VAT Input Payable (2200)<br/>Cr. Accounts Payable (2000)"]
        SB --> SP[Supplier Payment]
        SP -- "Post Payment" --> JE4["Journal Entry<br/>Dr. Accounts Payable (2000)<br/>Cr. Bank / Cash (1020/1010)"]
    end
```

### Standard Posting Matrix

| Transaction             | Debit Account                  | Credit Account                    | VAT Handling                           |
| ----------------------- | ------------------------------ | --------------------------------- | -------------------------------------- |
| **Sales Invoice**       | Accounts Receivable (`1200`)   | Service Income (`4000`)           | Output VAT (`2210`) credited at 5%     |
| **Customer Payment**    | Bank (`1020`) or Cash (`1010`) | Accounts Receivable (`1200`)      | N/A                                    |
| **Sales Credit Note**   | Service Income (`4000`)        | Accounts Receivable (`1200`)      | Output VAT (`2210`) debited (reversed) |
| **Supplier Bill**       | Purchase Materials (`5010`)    | Accounts Payable (`2000`)         | Input VAT (`2200`) debited at 5%       |
| **Supplier Payment**    | Accounts Payable (`2000`)      | Bank (`1020`) or Cash (`1010`)    | N/A                                    |
| **Purchase Debit Note** | Accounts Payable (`2000`)      | Purchase Materials (`5010`)       | Input VAT (`2200`) credited (reversed) |
| **Asset Depreciation**  | Depreciation Expense (`5xxx`)  | Accumulated Depreciation (`1xxx`) | N/A                                    |

---

## 👥 Role-Based Access Control (RBAC) Matrix

The system enforces strict role-based authorization via edge middleware and server-side checks:

| Module / Action                      | `SUPER_ADMIN` |   `ADMIN`    | `ACCOUNTANT` |     `HR`     | `INVENTORY_MANAGER` |    `USER`     |
| ------------------------------------ | :-----------: | :----------: | :----------: | :----------: | :-----------------: | :-----------: |
| **User & Role Administration**       |    ✅ Full    | ❌ View Only |      ❌      |      ❌      |         ❌          |      ❌       |
| **Audit Logs**                       |      ✅       |      ✅      |      ❌      |      ❌      |         ❌          |      ❌       |
| **Financial Statements (P&L, BS)**   |      ✅       |      ✅      |      ✅      |      ❌      |         ❌          |      ❌       |
| **General Ledger & Journal Entries** |      ✅       |      ✅      |      ✅      |      ❌      |         ❌          |      ❌       |
| **Commercial Invoices & Payments**   |      ✅       |      ✅      |      ✅      |      ❌      |      View Only      |   View Only   |
| **Purchase Orders & Requisitions**   |      ✅       |      ✅      |      ✅      |      ❌      |         ✅          |   Create PR   |
| **Inventory & Stock Movements**      |      ✅       |      ✅      |  View Only   |      ❌      |         ✅          |   View Only   |
| **Fitout Projects & Cost Tracking**  |      ✅       |      ✅      |      ✅      |      ❌      |      View Only      | Assigned Only |
| **HR, Attendance & Leaves**          |      ✅       |      ✅      |  View Only   |      ✅      |         ❌          | Personal Only |
| **Engineering & Company Documents**  |      ✅       |      ✅      |      ✅      | ✅ (Letters) |         ❌          |   View Only   |

---

## 🏁 Getting Started

### Prerequisites

- **Node.js**: v20.x or higher (LTS recommended)
- **Package Manager**: `pnpm` (v9+)
- **Database**: PostgreSQL 16+ (or Docker)

### Local Installation

Clone the repository and install project dependencies:

```bash
git clone https://github.com/Rahmankhattak711/agm.git
cd agm
pnpm install
```

### Docker PostgreSQL Setup

If you do not have a local PostgreSQL instance, start one using Docker Compose:

```bash
docker compose up -d
```

This launches a PostgreSQL 16 container named `agm_postgres` mapped to port `5432` with a persistent volume `agm_pgdata`.

### Environment Configuration

Create a `.env` file in the root directory (based on `.env.example`):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agm_db?schema=public"

# Cryptographic Secrets (minimum 32 characters)
JWT_ACCESS_SECRET="agm_access_secret_super_key_2026_secure_minimum_32_chars"

# Token Expiry & Security Policy
ACCESS_TOKEN_TTL_MINUTES="480"
REFRESH_TOKEN_TTL_DAYS="7"
MAX_FAILED_LOGINS="5"
LOCKOUT_MINUTES="480"

# Application URLs
APP_ORIGIN="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Initial Super Admin Seed Credentials
SEED_ADMIN_EMAIL="admin@agm.ae"
SEED_ADMIN_PASSWORD="AdminPassword123!"
```

### Database Migration & Seeding

Generate the Prisma client, apply all database migrations, and seed the default Super Admin user:

```bash
pnpm run prisma:generate
pnpm run prisma:migrate
pnpm run prisma:seed
```

### Running the Application

Start the local development server:

```bash
pnpm dev
```

- **Application Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Interactive API Documentation (Swagger)**: [http://localhost:3000/docs](http://localhost:3000/docs)
- **OpenAPI 3.0 JSON Specification**: [http://localhost:3000/api/doc](http://localhost:3000/api/doc)

---

## ⚙️ Environment Variables Reference

| Variable                   | Required | Default                 | Description                                                           |
| -------------------------- | :------: | ----------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`             |   Yes    | `postgresql://...`      | PostgreSQL connection string including schema                         |
| `JWT_ACCESS_SECRET`        |   Yes    | —                       | Secret key (>= 32 characters) for signing and verifying access tokens |
| `ACCESS_TOKEN_TTL_MINUTES` |    No    | `480` (8 hrs)           | Access token validity window in minutes                               |
| `REFRESH_TOKEN_TTL_DAYS`   |    No    | `7`                     | Refresh token lifespan in days                                        |
| `MAX_FAILED_LOGINS`        |    No    | `5`                     | Maximum failed login attempts before temporary account lockout        |
| `LOCKOUT_MINUTES`          |    No    | `480`                   | Lockout duration after exceeding failed login attempts                |
| `APP_ORIGIN`               |    No    | `http://localhost:3000` | Allowed application origin for CORS and cookie domain matching        |
| `NEXT_PUBLIC_APP_URL`      |    No    | `http://localhost:3000` | Publicly exposed application root URL                                 |
| `SEED_ADMIN_EMAIL`         |    No    | `admin@agm.ae`          | Default Super Admin email created by `prisma/seed.ts`                 |
| `SEED_ADMIN_PASSWORD`      |    No    | `AdminPassword123!`     | Initial password for the seeded Super Admin account                   |
| `API_PROXY_URL`            |    No    | —                       | Optional upstream backend target for `/api/proxy/*` rewrites          |

---

## 💻 Available Scripts

| Command                    | Action                                                            |
| -------------------------- | ----------------------------------------------------------------- |
| `pnpm dev`                 | Launch the Next.js development server with hot-module reloading   |
| `pnpm build`               | Generate Prisma client and create an optimized production build   |
| `pnpm start`               | Run the Next.js production server                                 |
| `pnpm test`                | Execute the test suite using Vitest                               |
| `pnpm lint`                | Run ESLint to detect syntax and architectural code issues         |
| `pnpm format`              | Automatically format all codebase files with Prettier             |
| `pnpm run format:check`    | Verify that all files conform to Prettier formatting guidelines   |
| `pnpm run prisma:generate` | Generate the typed Prisma Client into `app/generated/prisma`      |
| `pnpm run prisma:migrate`  | Execute pending Prisma schema migrations in development           |
| `pnpm run prisma:seed`     | Run `prisma/seed.ts` to provision initial administrative accounts |
| `pnpm run prisma:studio`   | Open interactive Prisma Studio web GUI to browse database tables  |
| `pnpm run clean:comments`  | Run the comment sanitation utility script                         |

---

## 📖 API Documentation (Swagger / OpenAPI)

AGM ERP includes integrated OpenAPI 3.0 documentation generated dynamically from JSDoc route annotations:

1. Start the application (`pnpm dev`).
2. Navigate to [http://localhost:3000/docs](http://localhost:3000/docs) in your browser.
3. Authenticate within Swagger UI by clicking the **Authorize** button and supplying your Bearer JWT token:
   ```plaintext
   Bearer <your_access_token>
   ```

Endpoints documented include:

- `/api/auth/*` (Login, Token Refresh, Session info, Logout)
- `/api/commercial/*` (Quotations, Orders, Invoices, Receipts, Credit/Debit Notes, Agreements)
- `/api/inventory/*` (Products, Warehouses, Stock Movements, POs)
- `/api/finance/*` (Chart of Accounts, Journal Entries, Expenses)
- `/api/reports/*` (P&L, Balance Sheet, Trial Balance, AR/AP Aging, VAT Summary)
- `/api/employees/*` (Directory, Attendance, Leaves, Bonuses)
- `/api/projects/*` (Projects directory, Milestone updates, Cost allocation)

---

## 🔒 Security & Authentication Model

1. **Edge-Safe Middleware**: Next.js Edge Middleware inspects incoming requests using `jose`. Unauthenticated requests to protected endpoints receive immediate `401 Unauthorized` responses before reaching route handlers.
2. **Dual-Token Architecture**:
   - Short-lived Access Tokens are stored in client memory or HttpOnly cookies.
   - Long-lived Refresh Tokens are stored hashed in the PostgreSQL database with family tracking (`familyId`). If a token is reused after rotation, the entire family is immediately invalidated to prevent replay attacks.
3. **Password Policy Enforcement**:
   - Minimum 12 characters.
   - At least 1 uppercase letter, 1 lowercase letter, and 1 digit.
   - Passwords hashed using `bcryptjs` with salt rounds.
4. **Brute Force Protection**: Automatic account lockout for `LOCKOUT_MINUTES` after `MAX_FAILED_LOGINS` consecutive incorrect attempts.
5. **Security Headers**: Production HTTP response headers enforce `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, and a strict `Content-Security-Policy`.

---

## 🧪 Testing & Quality Assurance

The codebase uses [Vitest](https://vitest.dev/) for unit and integration testing.

Run all tests:

```bash
pnpm test
```

Test coverage focuses on:

- Password policy validation and bcrypt hashing integrity.
- JWT Access and Refresh token generation, expiration, and cryptographic signature verification.
- Double-entry debit and credit balance integrity.

---

## 📄 License & Company Notice

This software is proprietary and confidential.

Developed for:
**AGM Aesthetic House Fitout Technical Services L.L.C**  
Dubai, United Arab Emirates  
_TRN: 104094432200003_
