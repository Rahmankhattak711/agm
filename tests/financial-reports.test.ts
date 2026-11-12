import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthUser } from "@/lib/auth-server";
import { GET as getBalanceSheet } from "@/app/api/finance/reports/balance-sheet/route";
import { GET as getCashFlow } from "@/app/api/finance/reports/cash-flow/route";
import { GET as getProfitLoss } from "@/app/api/finance/reports/profit-and-loss/route";
import { GET as getTrialBalance } from "@/app/api/finance/reports/trial-balance/route";
import {
  GET as getYearEndClosing,
  POST as postYearEndClosing,
} from "@/app/api/finance/reports/year-end-closing/route";
import { GET as getStatementOfAccount } from "@/app/api/reports/statement-of-account/route";
import { microCache } from "@/lib/modules/accounting/cache/micro-cache";
import prisma from "@/lib/prisma";
import { YearEndClosingService } from "@/lib/services/accounting/year-end-closing.service";

// Hoist mocks to avoid Vitest hoisting ReferenceError
const { authState, mockPrisma, mockHandlers } = vi.hoisted(() => {
  const authState = {
    currentUser: null as AuthUser | null,
  };

  const mockPrisma = {
    chartOfAccount: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    journalEntryLine: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    fiscalYearClosing: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    customer: {
      findUnique: vi.fn().mockResolvedValue({
        id: "cust-1",
        name: "Acme Trading",
        companyName: "Acme LLC",
        customerCode: "CUST-001",
      }),
    },
    salesInvoice: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    customerPayment: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    creditNote: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    salesReturn: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    quotation: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    salesOrder: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    project: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };

  const mockHandlers = {
    pnlExecute: vi.fn().mockResolvedValue({
      summary: { totalRevenue: 0, totalExpense: 0, netProfit: 0 },
      breakdown: [],
    }),
    yearSummary: vi.fn().mockResolvedValue({
      year: 2026,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      totalRevenue: 1000,
      totalExpense: 600,
      netProfitLoss: 400,
      isClosed: false,
    }),
    yearClose: vi.fn().mockResolvedValue({
      closed: true,
      year: 2026,
    }),
  };

  return { authState, mockPrisma, mockHandlers };
});

vi.mock("@/lib/auth-server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth-server")>();
  return {
    ...actual,
    getAuthUser: vi.fn(async () => authState.currentUser),
  };
});

vi.mock("@/lib/prisma", () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}));

vi.mock("@/lib/modules/accounting", () => ({
  GetProfitLossQueryHandler: {
    execute: (...args: any[]) => mockHandlers.pnlExecute(...args),
  },
}));

vi.mock("@/lib/services/accounting/year-end-closing.service", () => ({
  YearEndClosingService: {
    calculateYearSummary: (...args: any[]) => mockHandlers.yearSummary(...args),
    closeFiscalYear: (...args: any[]) => mockHandlers.yearClose(...args),
  },
}));

describe("Financial Reports Authorization (Step 3)", () => {
  const users: Record<string, AuthUser> = {
    superAdmin: {
      id: "usr-super-admin",
      email: "superadmin@agm.ae",
      fullName: "Super Admin",
      role: "SUPER_ADMIN",
      isActive: true,
    },
    admin: {
      id: "usr-admin",
      email: "admin@agm.ae",
      fullName: "Admin",
      role: "ADMIN",
      isActive: true,
    },
    accountant: {
      id: "usr-accountant",
      email: "accountant@agm.ae",
      fullName: "Accountant",
      role: "ACCOUNTANT",
      isActive: true,
    },
    hr: {
      id: "usr-hr",
      email: "hr@agm.ae",
      fullName: "HR Specialist",
      role: "HR",
      isActive: true,
    },
    inventoryManager: {
      id: "usr-inventory",
      email: "inventory@agm.ae",
      fullName: "Inventory Manager",
      role: "INVENTORY_MANAGER",
      isActive: true,
    },
    user: {
      id: "usr-standard",
      email: "user@agm.ae",
      fullName: "Standard User",
      role: "USER",
      isActive: true,
    },
  };

  const allowedRoles = ["superAdmin", "admin", "accountant"] as const;
  const deniedRoles = ["hr", "inventoryManager", "user"] as const;

  beforeEach(() => {
    vi.clearAllMocks();
    microCache.invalidatePrefix("");
  });

  describe("1. GET /api/finance/reports/balance-sheet", () => {
    it("returns 401 when unauthenticated and does not query database", async () => {
      authState.currentUser = null;
      const req = new Request("http://localhost:3000/api/finance/reports/balance-sheet");
      const res = await getBalanceSheet(req);

      expect(res.status).toBe(401);
      expect(prisma.chartOfAccount.findMany).not.toHaveBeenCalled();
    });

    for (const roleKey of deniedRoles) {
      it(`denies ${roleKey} with 403 and does not query database`, async () => {
        authState.currentUser = users[roleKey];
        const req = new Request("http://localhost:3000/api/finance/reports/balance-sheet");
        const res = await getBalanceSheet(req);

        expect(res.status).toBe(403);
        expect(prisma.chartOfAccount.findMany).not.toHaveBeenCalled();
      });
    }

    for (const roleKey of allowedRoles) {
      it(`allows ${roleKey} with 200 and queries database`, async () => {
        authState.currentUser = users[roleKey];
        const req = new Request("http://localhost:3000/api/finance/reports/balance-sheet?refresh=true");
        const res = await getBalanceSheet(req);

        expect(res.status).toBe(200);
        expect(prisma.chartOfAccount.findMany).toHaveBeenCalled();
      });
    }
  });

  describe("2. GET /api/finance/reports/cash-flow", () => {
    it("returns 401 when unauthenticated and does not query database", async () => {
      authState.currentUser = null;
      const req = new Request("http://localhost:3000/api/finance/reports/cash-flow");
      const res = await getCashFlow(req);

      expect(res.status).toBe(401);
      expect(prisma.journalEntryLine.findMany).not.toHaveBeenCalled();
    });

    for (const roleKey of deniedRoles) {
      it(`denies ${roleKey} with 403 and does not query database`, async () => {
        authState.currentUser = users[roleKey];
        const req = new Request("http://localhost:3000/api/finance/reports/cash-flow");
        const res = await getCashFlow(req);

        expect(res.status).toBe(403);
        expect(prisma.journalEntryLine.findMany).not.toHaveBeenCalled();
      });
    }

    for (const roleKey of allowedRoles) {
      it(`allows ${roleKey} with 200 and queries database`, async () => {
        authState.currentUser = users[roleKey];
        const req = new Request("http://localhost:3000/api/finance/reports/cash-flow");
        const res = await getCashFlow(req);

        expect(res.status).toBe(200);
        expect(prisma.journalEntryLine.findMany).toHaveBeenCalled();
      });
    }
  });

  describe("3. GET /api/finance/reports/profit-and-loss", () => {
    it("returns 401 when unauthenticated and does not execute handler", async () => {
      authState.currentUser = null;
      const req = new Request("http://localhost:3000/api/finance/reports/profit-and-loss");
      const res = await getProfitLoss(req);

      expect(res.status).toBe(401);
      expect(mockHandlers.pnlExecute).not.toHaveBeenCalled();
    });

    for (const roleKey of deniedRoles) {
      it(`denies ${roleKey} with 403 and does not execute handler`, async () => {
        authState.currentUser = users[roleKey];
        const req = new Request("http://localhost:3000/api/finance/reports/profit-and-loss");
        const res = await getProfitLoss(req);

        expect(res.status).toBe(403);
        expect(mockHandlers.pnlExecute).not.toHaveBeenCalled();
      });
    }

    for (const roleKey of allowedRoles) {
      it(`allows ${roleKey} with 200 and executes handler`, async () => {
        authState.currentUser = users[roleKey];
        const req = new Request("http://localhost:3000/api/finance/reports/profit-and-loss");
        const res = await getProfitLoss(req);

        expect(res.status).toBe(200);
        expect(mockHandlers.pnlExecute).toHaveBeenCalled();
      });
    }
  });

  describe("4. GET /api/finance/reports/trial-balance", () => {
    it("returns 401 when unauthenticated and does not query database", async () => {
      authState.currentUser = null;
      const req = new Request("http://localhost:3000/api/finance/reports/trial-balance");
      const res = await getTrialBalance(req);

      expect(res.status).toBe(401);
      expect(prisma.chartOfAccount.findMany).not.toHaveBeenCalled();
    });

    for (const roleKey of deniedRoles) {
      it(`denies ${roleKey} with 403 and does not query database`, async () => {
        authState.currentUser = users[roleKey];
        const req = new Request("http://localhost:3000/api/finance/reports/trial-balance");
        const res = await getTrialBalance(req);

        expect(res.status).toBe(403);
        expect(prisma.chartOfAccount.findMany).not.toHaveBeenCalled();
      });
    }

    for (const roleKey of allowedRoles) {
      it(`allows ${roleKey} with 200 and queries database`, async () => {
        authState.currentUser = users[roleKey];
        const req = new Request("http://localhost:3000/api/finance/reports/trial-balance?refresh=true");
        const res = await getTrialBalance(req);

        expect(res.status).toBe(200);
        expect(prisma.chartOfAccount.findMany).toHaveBeenCalled();
      });
    }
  });

  describe("5. GET /api/finance/reports/year-end-closing", () => {
    it("returns 401 when unauthenticated and does not execute service or query database", async () => {
      authState.currentUser = null;
      const req = new Request("http://localhost:3000/api/finance/reports/year-end-closing");
      const res = await getYearEndClosing(req);

      expect(res.status).toBe(401);
      expect(mockHandlers.yearSummary).not.toHaveBeenCalled();
      expect(prisma.fiscalYearClosing.findMany).not.toHaveBeenCalled();
    });

    for (const roleKey of deniedRoles) {
      it(`denies ${roleKey} with 403 and does not execute service or query database`, async () => {
        authState.currentUser = users[roleKey];
        const req = new Request("http://localhost:3000/api/finance/reports/year-end-closing");
        const res = await getYearEndClosing(req);

        expect(res.status).toBe(403);
        expect(mockHandlers.yearSummary).not.toHaveBeenCalled();
        expect(prisma.fiscalYearClosing.findMany).not.toHaveBeenCalled();
      });
    }

    for (const roleKey of allowedRoles) {
      it(`allows ${roleKey} with 200 and executes service`, async () => {
        authState.currentUser = users[roleKey];
        const req = new Request("http://localhost:3000/api/finance/reports/year-end-closing");
        const res = await getYearEndClosing(req);

        expect(res.status).toBe(200);
        expect(mockHandlers.yearSummary).toHaveBeenCalled();
        expect(prisma.fiscalYearClosing.findMany).toHaveBeenCalled();
      });
    }
  });

  describe("6. POST /api/finance/reports/year-end-closing (Unchanged & Preserved)", () => {
    it("returns 401 when unauthenticated", async () => {
      authState.currentUser = null;
      const req = new Request("http://localhost:3000/api/finance/reports/year-end-closing", {
        method: "POST",
        body: JSON.stringify({ year: 2026 }),
      });
      const res = await postYearEndClosing(req);

      expect(res.status).toBe(401);
      expect(mockHandlers.yearClose).not.toHaveBeenCalled();
    });

    for (const roleKey of deniedRoles) {
      it(`denies ${roleKey} with 403 and message`, async () => {
        authState.currentUser = users[roleKey];
        const req = new Request("http://localhost:3000/api/finance/reports/year-end-closing", {
          method: "POST",
          body: JSON.stringify({ year: 2026 }),
        });
        const res = await postYearEndClosing(req);

        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toContain("Only Accountants and Admins");
        expect(mockHandlers.yearClose).not.toHaveBeenCalled();
      });
    }

    for (const roleKey of allowedRoles) {
      it(`allows ${roleKey} with 200 and closes fiscal year`, async () => {
        authState.currentUser = users[roleKey];
        const req = new Request("http://localhost:3000/api/finance/reports/year-end-closing", {
          method: "POST",
          body: JSON.stringify({ year: 2026 }),
        });
        const res = await postYearEndClosing(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(mockHandlers.yearClose).toHaveBeenCalled();
      });
    }
  });

  describe("7. GET /api/reports/statement-of-account", () => {
    it("returns 401 when unauthenticated and does not query database", async () => {
      authState.currentUser = null;
      const req = new Request("http://localhost:3000/api/reports/statement-of-account?customerId=cust-1");
      const res = await getStatementOfAccount(req);

      expect(res.status).toBe(401);
      expect(prisma.customer.findUnique).not.toHaveBeenCalled();
    });

    for (const roleKey of deniedRoles) {
      it(`denies ${roleKey} with 403 and does not query database`, async () => {
        authState.currentUser = users[roleKey];
        const req = new Request("http://localhost:3000/api/reports/statement-of-account?customerId=cust-1");
        const res = await getStatementOfAccount(req);

        expect(res.status).toBe(403);
        expect(prisma.customer.findUnique).not.toHaveBeenCalled();
      });
    }

    for (const roleKey of allowedRoles) {
      it(`allows ${roleKey} with 200 and queries database`, async () => {
        authState.currentUser = users[roleKey];
        const req = new Request("http://localhost:3000/api/reports/statement-of-account?customerId=cust-1");
        const res = await getStatementOfAccount(req);

        expect(res.status).toBe(200);
        expect(prisma.customer.findUnique).toHaveBeenCalled();
      });
    }
  });
});
