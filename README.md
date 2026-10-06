# AGM Aesthetic House ERP

> **Modern ERP & Accounting Platform for Interior Fit-out & Technical Contracting**  
> Custom-built for *AGM Aesthetic House Fitout Technical Services L.L.C* (Dubai, United Arab Emirates).

[![Next.js](https://img.shields.io/badge/Next.js-15.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.13-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

---

## 🎯 Purpose & Key Features

AGM ERP connects commercial sales, procurement, site cost-tracking, and double-entry accounting into a single real-time operational engine compliant with UAE statutory regulations:

* **Commercial & Billing**: Bill of Quantities (BOQ) quotations, sales orders, FTA-compliant tax invoices (5% UAE VAT), payment receipts, and customer Statements of Account (SOA).
* **Automated Accounting**: Double-entry general ledger with automatic journal posting from invoices and bills, real-time Chart of Accounts, and VAT Form 201 returns.
* **Project Cost Tracking**: Live budget vs. actual cost tracking per project across materials, labor, subcontractors, and equipment.
* **Procurement & Inventory**: Requisitions, purchase orders, Goods Received Notes (GRN) with automatic stock updates, and multi-warehouse tracking.
* **Workforce Operations**: UAE Labor Law & WPS compliance (Emirates ID, Visa, SIF), daily attendance, leave approvals, and employee records.
* **Role-Based Security**: Strict access control (`SUPER_ADMIN`, `ADMIN`, `ACCOUNTANT`, `HR`, `INVENTORY_MANAGER`, `USER`) powered by JWT.

---

## 🔄 Workflow Lifecycle

```
[ Quotation (BOQ) ] ──► [ Tax Invoice ] ──► [ Project Execution ] ──► [ Payment Receipt ]
          │                    │                     │                      │
          ▼                    ▼                     ▼                      ▼
    Client Sign-off       GL Auto-Posting     Cost vs. Budget        A/R Reconciliation
```

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS v4 |
| **Backend & API** | Next.js Route Handlers, OpenAPI / Swagger (`/docs`) |
| **Database** | PostgreSQL 16 via Prisma ORM |
| **State Management** | TanStack React Query v5 |
| **Authentication** | Dual JWT (Access Token + Refresh Token rotation) |

---

## 🚀 Quick Setup

### 1. Clone & Install
```bash
git clone https://github.com/Rahmankhattak711/agm.git
cd agm
pnpm install
```

### 2. Configure Environment (`.env`)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agm_db?schema=public"
JWT_SECRET="your-jwt-secret-key"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialize Database & Run
```bash
pnpm run prisma:generate    # Generate Prisma client
pnpm run prisma:migrate     # Apply migrations
pnpm dev                    # Start app at http://localhost:3000
```

> **API Docs**: Interactive Swagger documentation is live at `http://localhost:3000/docs`.

---

## 📜 Essential Commands

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Start development server |
| `pnpm build` | Build production application |
| `pnpm start` | Run production server |
| `pnpm lint` | Run ESLint validation |
| `pnpm run prisma:studio` | Open web database browser |

---

## 🏢 Ownership

Proprietary software developed for **AGM Aesthetic House Fitout Technical Services L.L.C**, Dubai, UAE.
