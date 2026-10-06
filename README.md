# AGM ERP

ERP and financial management system for **AGM Aesthetic House Fitout Technical Services L.L.C** (Dubai, UAE).

---

## Features

- **Commercial**: Quotations, Sales Orders, Tax Invoices (5% UAE VAT), Payments, and Customer SOA.
- **Finance**: Double-entry General Ledger, Chart of Accounts, Expenses, and VAT reports.
- **Projects**: Budget vs. actual cost tracking (materials, labor, subcontractors).
- **Inventory**: Multi-warehouse stock tracking, GRN, and purchase orders.
- **HR & Operations**: Attendance, leave management, employee records, and assets.

---

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4
- **Backend & Database**: Next.js API Routes, Prisma ORM, PostgreSQL
- **State**: TanStack Query v5

---

## Getting Started

### 1. Install dependencies
```bash
pnpm install
```

### 2. Configure environment
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agm_db?schema=public"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Run migrations & start server
```bash
pnpm run prisma:generate
pnpm run prisma:migrate
pnpm dev
```

App runs at: **http://localhost:3000**  
API Documentation: **http://localhost:3000/docs**

---

## Commands

- `pnpm dev` – Start dev server
- `pnpm build` – Build for production
- `pnpm start` – Run production build
- `pnpm run prisma:studio` – Open database GUI
