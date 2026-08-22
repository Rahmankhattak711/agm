<p align="center">
  <img src="public/assets/logo.png" alt="AGM Aesthetic House Logo" width="220" />
</p>

<h1 align="center">AGM Aesthetic House ERP & Financial Management System</h1>

<p align="center">
  <strong>Enterprise-grade ERP, Accounting, Inventory & Operations Management Platform</strong><br>
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

### 1. 💼 Financial Accounting & Statutory Reports (`/finance`)

- **Interactive Financial & Operations Dashboard (`/dashboard`)**:
  - Live revenue, net margins, asset balances, and WPS-compliant workforce statistics.
  - Real-time double-entry ledger sync and balance sheet validation alerts.
- **Chart of Accounts (`/finance/accounts`)**:
  - Full double-entry general ledger with Assets, Liabilities, Equity, Revenue, and Expense hierarchies.
- **General Journal Entries (`/finance/journal-entries`)**:
  - Standardized double-entry transaction posting, line-level 5% UAE VAT generation, draft/posted status controls, and balance integrity checks.
- **Financial Statements & Reports (`/finance/reports`)**:
  - **Profit & Loss Statement (Income Statement)**: Operating revenue, direct expenses, operating expenses, and net profit margins.
  - **Balance Sheet**: Assets vs. Liabilities & Equity snapshot with balance audit indicators.
  - **Trial Balance**: Debit/Credit ledger balances by account category.
  - **General Ledger Statement**: Running account balances and transaction histories.
  - **UAE VAT Position (FTA Form 201)**: Live automated calculation of 5% Output VAT (sales) and 5% Input VAT (purchases) with quarterly and box schedule breakdowns.
  - **Executive Summary & Financial Health Ratios**: Liquidity ratios, profit margins, and audit checklists.
- **Commercial Quotation & Proposal Generator (`/finance/reports` -> Quotation Tab)**:
  - Interactive quotation builder with live catalog item selection, unit pricing, dynamic 5% VAT calculations, discount fields, amount in words (AED), signature blocks, and official A4 print layouts.
- **Petty Cash Float & Disbursements (`/finance/petty-cash`)**:
  - Daily custodian disbursements, top-ups, receipt image attachments, voucher approval workflows, and live float balances.

### 2. 📦 Inventory & Procurement (`/inventory`)

- **Products & Raw Materials (`/inventory/products`)**: SKU catalog, category classification, unit measurements (PCS, SQM, MTR, LOT, KG), reorder alert thresholds, and pricing.
- **Warehouses & Storage Locations (`/inventory/warehouses`)**: Multi-warehouse capacity tracking, manager assignment, and zone locations across UAE.
- **Stock Movements & Transfers (`/inventory/stock-movements`)**: IN, OUT, and TRANSFER transaction auditing with balance updates.
- **Purchase Orders (`/inventory/purchase-orders`)**: Supplier procurement orders, approval workflows, and receiving status.
- **Vendors & Suppliers (`/inventory/suppliers`)**: Vendor registry, Tax Registration Numbers (TRN), contact management, and catalog lines.

### 3. 👥 Human Capital & Workforce Operations (`/operations`)

- **Employee Master Directory (`/operations/employees`)**: Automatically synchronized with registered user accounts, UAE labor compliance, Emirates ID tracking, visa expiries, and WPS bank details (IBAN/CBUAE SIF ready).
- **Daily Attendance & Timesheets (`/operations/attendance`)**: Check-in / check-out timestamps, working hours, overtime tracking, site notes, and one-click `Mark All Present` batch actions.
- **Leave Management (`/operations/leaves`)**: Annual, Sick, Unpaid, and Emergency leave balances, duration calculators, and approval pipelines.
- **Bonuses & Performance Incentives (`/operations/bonuses`)**: Commission and performance bonus approvals and payout tracking.
- **Fixed Asset Management (`/operations/fixed-assets`)**: Fixed asset registry, vehicle and equipment tracking, and straight-line depreciation schedules.

### 4. 🛡️ Role-Based Access Control & Administration (`/administration`)

- **User Management (`/administration/users`)**: JWT authentication with refresh token rotation and activity tracking.
- **Roles**: `SUPER_ADMIN`, `ADMIN`, `ACCOUNTANT`, `HR`, `INVENTORY_MANAGER`, and `USER`.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions, API Routes)
- **Frontend Library**: [React 19](https://react.dev/)
- **Database & ORM**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **State & Server Cache**: [@tanstack/react-query](https://tanstack.com/query) v5 with optimistic mutations and automatic cache invalidation
- **Data Tables & Forms**: [@tanstack/react-table](https://tanstack.com/table) v8 & [@tanstack/react-form](https://tanstack.com/form)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with AGM Design System tokens (Forest Green, Navy, Charcoal, Warm Ivory `#f6f5f0`)
- **Code Quality**: [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/)
- **API Documentation**: OpenAPI / Swagger UI via `swagger-ui-react` at `/api/doc` and `/docs`

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.18.0 or later
- **pnpm**: v9 or later (or npm / yarn)
- **PostgreSQL**: Running locally or via Docker / Supabase / Neon

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd agm

# Install dependencies using pnpm
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL Database URL
DATABASE_URL="postgresql://postgres:password@localhost:5432/agm_db?schema=public"

# JWT Authentication Secrets
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Setup Database Schema

```bash
# Generate Prisma client
pnpm prisma:generate

# Push schema to PostgreSQL database
pnpm prisma:migrate
# or
npx prisma db push

# (Optional) Open Prisma Studio to browse data
pnpm prisma:studio
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```text
agm/
├── app/
│   ├── (auth)/                   # Authentication routes (login, signup)
│   ├── (workspace)/              # Protected ERP workspace routes
│   │   ├── administration/       # User & role management
│   │   ├── dashboard/            # Financial & operational KPI dashboard
│   │   ├── finance/              # Accounts, journal entries, petty cash, reports & quotations
│   │   ├── inventory/            # Products, warehouses, movements, purchase orders, suppliers
│   │   └── operations/           # Employees, attendance, leaves, bonuses, fixed assets
│   ├── api/                      # RESTful backend API routes
│   │   ├── accounts/             # Chart of accounts endpoints
│   │   ├── auth/                 # Sign-in, sign-up, refresh, sign-out
│   │   ├── doc/                  # Swagger JSON specification
│   │   ├── employees/            # Employee master, attendance, leaves, bonuses
│   │   ├── finance/              # Quotation endpoints
│   │   ├── inventory/            # Products, stock, POs, suppliers, warehouses
│   │   ├── journal-entries/      # General ledger transactions
│   │   ├── petty-cash/           # Petty cash vouchers & approval
│   │   ├── reports/              # P&L, Balance sheet, Trial balance, VAT returns, Ledger
│   │   └── users/                # User administration endpoints
│   ├── docs/                     # Swagger UI interactive documentation page
│   ├── globals.css               # Design system tokens and global styles
│   ├── layout.tsx                # Root layout with QueryClientProvider & AuthProvider
│   └── page.tsx                  # Landing / login redirection
├── components/
│   ├── icons/                    # Standardized SVG icon components
│   ├── layout/                   # Workspace layout & header
│   ├── quotation/                # Quotation generator subcomponents & constants
│   ├── ui/                       # Reusable design system primitives (Button, Input, Select, Table, Modal)
│   ├── AgmLogo.tsx               # Official responsive SVG/image brand logo
│   ├── BarChart.tsx              # Interactive bar chart component
│   ├── QuotationTemplate.tsx     # Official UAE quotation template with print banner
│   ├── Sidebar.tsx               # Collapsible navigation sidebar
│   └── StatCard.tsx              # KPI metric cards with sparklines & trend pills
├── context/
│   └── AuthContext.tsx           # Authentication state & session manager
├── lib/
│   ├── hooks/
│   │   └── api-hooks.ts          # Comprehensive TanStack Query hooks
│   ├── api-client.ts             # Authenticated fetch wrapper with token refresh
│   ├── auth-server.ts            # Server-side auth & role verification
│   ├── navigation.ts             # Workspace routing metadata & breadcrumbs
│   ├── prisma.ts                 # Global Prisma client instance
│   └── swagger.ts                # Swagger/OpenAPI definition generator
└── prisma/
    └── schema.prisma             # Full relational ERP database schema
```

---

## 📜 Available Scripts

| Command                | Description                                         |
| :--------------------- | :-------------------------------------------------- |
| `pnpm dev`             | Starts the Next.js development server on port 3000  |
| `pnpm build`           | Compiles the production build (runs Prisma generate)|
| `pnpm start`           | Runs the compiled production application            |
| `pnpm lint`            | Runs ESLint checks                                  |
| `pnpm format`          | Formats the entire codebase with Prettier           |
| `pnpm format:check`    | Checks formatting without modifying files           |
| `pnpm prisma:generate` | Generates the Prisma Client                         |
| `pnpm prisma:migrate`  | Runs database migrations                            |
| `pnpm prisma:studio`   | Launches visual Prisma Studio database manager      |

---

## 📄 License

Private & Proprietary. All rights reserved by **AGM Aesthetic House Fitout Technical Services L.L.C**, Dubai, UAE.
