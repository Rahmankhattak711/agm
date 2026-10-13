<div align="center">
  <img src="./public/assets/logo.png" alt="AGM Logo" width="200" />
</div>

# AGM ERP

A comprehensive Enterprise Resource Planning (ERP) and financial management platform custom-built for **AGM Aesthetic House Fitout Technical Services L.L.C** (Dubai, UAE).

---

## 🚀 Core Modules

- **Administration & RBAC**: User account management, Role-Based Access Control matrix (Super Admin, Admin, Manager, Accountant, Employee), session management, and credential administration.
- **Commercial & Sales**: Quotations, Sales Orders, Tax Invoices (5% UAE VAT), Payments, and Customer Statement of Accounts (SOA).
- **Finance & Accounting**: Double-entry General Ledger, Chart of Accounts, Journal Entries, Expenses, Fixed Assets & Depreciation, and VAT reporting.
- **Projects & Costing**: Project lifecycle management with budget vs. actual cost tracking for materials, labor, and subcontractors.
- **Inventory & Supply Chain**: Multi-warehouse stock tracking, Products (Raw Materials, Consumables, Finished Goods), Purchase Orders, Goods Receipts (GRN), and Supplier Management.
- **HR & Operations**: Employee records, Emirates ID/Visa tracking, Daily Attendance, Leave Requests, Bonuses, and Department Metrics.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, Framer Motion
- **Backend**: Next.js App Router API Handlers
- **Database**: PostgreSQL with Prisma ORM
- **Security & Auth**: Edge-safe JWTs (`jose`), HTTP-only refresh cookies, bcrypt hashing, account lockout protection
- **Data & State**: TanStack Query v5, TanStack Form, TanStack Table
- **Charts**: Chart.js & React-Chartjs-2
- **Documentation**: Swagger UI & OpenAPI Specification

---

## 🏁 Getting Started

### 1. Prerequisites

- Node.js (v20+ recommended)
- `pnpm` (v9+)
- Docker & Docker Compose (optional, for local PostgreSQL)

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start local database (Docker)

```bash
docker compose up -d
```

Starts PostgreSQL 16 on port `5432` with container name `agm_postgres` and database `agm_db`.

### 4. Configure environment

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agm_db?schema=public"
JWT_ACCESS_SECRET="your_very_long_jwt_access_secret_min_32_chars"
ACCESS_TOKEN_TTL_MINUTES="15"
REFRESH_TOKEN_TTL_DAYS="7"
MAX_FAILED_LOGINS="5"
LOCKOUT_MINUTES="15"
APP_ORIGIN="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SEED_ADMIN_EMAIL="admin@agm.ae"
SEED_ADMIN_PASSWORD="AdminPassword123!"
```

### 5. Run migrations & seed

```bash
pnpm run prisma:generate
pnpm run prisma:migrate
pnpm run prisma:seed
```

### 6. Start development server

```bash
pnpm dev
```

- Application: **http://localhost:3000**
- API Documentation (Swagger): **http://localhost:3000/docs**

---

## 💻 Available Commands

- `pnpm dev` – Start development server
- `pnpm build` – Generate Prisma client and build production bundle
- `pnpm start` – Run production server
- `pnpm test` – Run Vitest test suite
- `pnpm lint` – Run ESLint code checks
- `pnpm format` – Run Prettier formatting
- `pnpm run format:check` – Verify code formatting
- `pnpm run prisma:generate` – Generate Prisma client
- `pnpm run prisma:migrate` – Run database migrations
- `pnpm run prisma:seed` – Seed default administrative account and initial data
- `pnpm run prisma:studio` – Launch interactive Prisma Studio database GUI

---

<div align="center">
  <i>Developed for AGM Aesthetic House Fitout Technical Services L.L.C</i>
</div>
