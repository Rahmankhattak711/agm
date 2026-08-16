# AGM Aesthetic House ERP & Financial Management System

An enterprise-grade ERP, accounting, inventory, and operations management platform built for **AGM Aesthetic House Fitout Technical Services L.L.C** (Dubai, UAE). Built with Next.js 15 (App Router), React 19, Prisma ORM, PostgreSQL, TanStack Query, and TanStack Table.

---

## 🌟 Key Features

### 1. 💼 Financial Accounting & Statutory Reports (`/finance`)
- **Chart of Accounts**: Full double-entry general ledger with Assets, Liabilities, Equity, Revenue, and Expense hierarchies.
- **Journal Entries & Daybook**: Double-entry transaction batches, posting controls, and balanced audit lines.
- **Financial Statements**: Real-time Statement of Profit & Loss (Income Statement), Balance Sheet, and Trial Balance matrix.
- **UAE VAT Position (FTA Form 201)**: Live automated calculation of 5% Output VAT (sales) and 5% Input VAT (recoverable supplier purchases).
- **Petty Cash & Fixed Assets**: Custodian disbursement logging, receipt image attachments, and straight-line depreciation schedules.
- **Commercial Quotation & Proposal Generator**: Interactive quotation builder with live product catalog synchronization, dynamic 5% VAT calculations, discount fields, amount in words in AED, and official pixel-perfect A4 print layouts.

### 2. 📦 Inventory & Procurement (`/inventory`)
- **Products & Raw Materials**: SKU catalog, category classification, unit measurements (PCS, SQM, MTR, LOT, KG), reorder alert thresholds, and pricing.
- **Warehouses & Storage Locations**: Multi-warehouse capacity tracking, manager assignment, and zone locations across UAE.
- **Stock Movements & Transfers**: IN, OUT, and TRANSFER transaction auditing with balance updates.
- **Purchase Orders (PO)**: Supplier procurement orders, approval workflows, and receiving status.
- **Vendors & Suppliers**: Vendor registry, Tax Registration Numbers (TRN), contact management, and catalog lines.

### 3. 👥 Human Capital & Workforce Operations (`/operations`)
- **Employee Master Directory**: Automatically synchronized with registered user accounts, UAE labor compliance, Emirates ID tracking, visa expiries, and WPS bank details (IBAN/CBUAE SIF ready).
- **Daily Attendance & Timesheets**: Check-in / check-out timestamps, working hours, overtime tracking, site notes, and one-click `Mark All Present` batch actions.
- **Leave Management**: Annual, Sick, Unpaid, and Emergency leave balances, duration calculators, and approval pipelines.
- **Bonuses & Performance Incentives**: Commission and performance bonus approvals and payout tracking.

### 4. 🛡️ Role-Based Access Control & Administration (`/administration`)
- **User Management**: JWT authentication with refresh token rotation.
- **Roles**: `SUPER_ADMIN`, `ADMIN`, `ACCOUNTANT`, `HR`, `INVENTORY_MANAGER`, and `USER`.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions, API Routes)
- **Frontend Library**: [React 19](https://react.dev/)
- **Database & ORM**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **State & Server Cache**: [@tanstack/react-query](https://tanstack.com/query) v5 with optimistic mutations and automatic cache invalidation
- **Data Tables**: [@tanstack/react-table](https://tanstack.com/table) v8 (with column sorting, search filters, and pagination)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with AGM Design System tokens (Forest Green, Charcoal, Warm Ivory `#f6f5f0`)
- **API Documentation**: OpenAPI / Swagger UI via `swagger-ui-react` at `/api/doc`

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
# Push schema to PostgreSQL database
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
│   ├── (workspace)/              # Protected ERP workspace routes
│   │   ├── administration/       # User & role management
│   │   ├── dashboard/            # Financial & operational KPI dashboard
│   │   ├── finance/              # Accounts, journal entries, petty cash, reports & quotations
│   │   ├── inventory/            # Products, warehouses, movements, purchase orders, suppliers
│   │   └── operations/           # Employees, attendance, leaves, bonuses, fixed assets
│   ├── api/                      # RESTful backend API routes
│   │   ├── accounts/
│   │   ├── auth/                 # Sign-in, sign-up, refresh, sign-out
│   │   ├── employees/            # Employee master & attendance endpoints
│   │   ├── inventory/            # Products, stock, POs, suppliers
│   │   ├── journal-entries/
│   │   └── reports/              # P&L, Balance sheet, Trial balance, VAT returns
│   ├── layout.tsx                # Root layout with QueryClientProvider & AuthProvider
│   ├── not-found.tsx             # Custom branded 404 error page
│   └── page.tsx                  # Landing / login redirection
├── components/
│   ├── ui/                       # Reusable design system primitives
│   │   ├── Button.tsx
│   │   ├── DataTable.tsx         # Generic TanStack Table component
│   │   ├── Input.tsx             # Input, Select, Textarea
│   │   ├── Table.tsx             # Table markup primitives & Modal
│   │   └── index.ts
│   ├── AgmLogo.tsx               # Official responsive SVG/image brand logo
│   ├── QuotationTemplate.tsx     # Official UAE quotation template with print banner
│   ├── Sidebar.tsx               # Collapsible navigation sidebar
│   └── Header.tsx                # Top workspace header & user profile
├── lib/
│   ├── hooks/
│   │   └── api-hooks.ts          # Comprehensive TanStack Query hooks
│   ├── api-client.ts             # Authenticated fetch wrapper with token refresh
│   ├── auth-server.ts            # Server-side auth & role verification
│   └── prisma.ts                 # Global Prisma client instance
└── prisma/
    └── schema.prisma             # Full relational ERP database schema
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the Next.js development server on port 3000 |
| `pnpm build` | Compiles the production build |
| `pnpm start` | Runs the compiled production application |
| `pnpm lint` | Runs ESLint checks |
| `pnpm prisma:generate` | Generates the Prisma Client |
| `pnpm prisma:migrate` | Runs database migrations |
| `pnpm prisma:studio` | Launches visual Prisma Studio database manager |

---

## 📄 License
Private & Proprietary. All rights reserved by **AGM Aesthetic House Fitout Technical Services L.L.C**, Dubai, UAE.
