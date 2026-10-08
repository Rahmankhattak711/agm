<div align="center">
  <img src="./public/assets/logo.png" alt="AGM Logo" width="200" />
</div>

# AGM ERP

A comprehensive Enterprise Resource Planning (ERP) and financial management system custom-built for **AGM Aesthetic House Fitout Technical Services L.L.C** (Dubai, UAE).

---

## 🚀 Core Modules

- **Commercial & Sales**: Quotations, Sales Orders, Tax Invoices (5% UAE VAT), Payments, and Customer Statement of Accounts (SOA).
- **Finance & Accounting**: Double-entry General Ledger, Chart of Accounts, Journal Entries, Expenses, Fixed Assets & Depreciation, and VAT reports.
- **Projects & Costing**: Budget vs. actual cost tracking for materials, labor, and subcontractors.
- **Inventory & Supply Chain**: Multi-warehouse stock tracking, Products (Raw Materials, Consumables, Finished Goods), Purchase Orders, Goods Receipts (GRN), and Supplier Management.
- **HR & Payroll**: Employee records, Emirates ID/Visa tracking, Daily Attendance, Leave Requests, Bonuses, and automated Payroll processing.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, Framer Motion
- **Backend**: Next.js API Routes / Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: TanStack Query v5
- **Forms & Tables**: TanStack Form, TanStack Table
- **Charts**: Chart.js & React-Chartjs-2

---

## 🏁 Getting Started

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
API Documentation (Swagger): **http://localhost:3000/docs**

---

## 💻 Commands

- `pnpm dev` – Start development server
- `pnpm build` – Build for production
- `pnpm start` – Run production build
- `pnpm run prisma:studio` – Open Prisma Studio to manage database
- `pnpm lint` – Run ESLint
- `pnpm format` – Run Prettier formatting
- `pnpm add -w <package>` – Add a package to the workspace root

---

<div align="center">
  <i>Developed for AGM Aesthetic House Fitout Technical Services L.L.C</i>
</div>
