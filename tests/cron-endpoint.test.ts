import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateCronSecret } from "@/lib/auth-server";
import { POST } from "@/app/api/cron/cleanup-tokens/route";
import prisma from "@/lib/prisma";

// Mock prisma
vi.mock("@/lib/prisma", () => {
  return {
    default: {
      $transaction: vi.fn(),
    },
  };
});

describe("Cron Token Cleanup Endpoint & Authentication", () => {
  const originalEnv = process.env;
  const validSecret = "super-secure-cron-secret-1234567890";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, CRON_SECRET: validSecret };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Authentication: validateCronSecret()", () => {
    it("returns false when Authorization header is completely missing", () => {
      const request = new Request("http://localhost:3000/api/cron/cleanup-tokens", {
        method: "POST",
      });
      expect(validateCronSecret(request)).toBe(false);
    });

    it("returns false for Basic or malformed authorization header", () => {
      const basicRequest = new Request("http://localhost:3000/api/cron/cleanup-tokens", {
        method: "POST",
        headers: { Authorization: `Basic ${Buffer.from("admin:password").toString("base64")}` },
      });
      expect(validateCronSecret(basicRequest)).toBe(false);

      const malformedRequest = new Request("http://localhost:3000/api/cron/cleanup-tokens", {
        method: "POST",
        headers: { Authorization: "InvalidBearerTokenWithoutPrefix" },
      });
      expect(validateCronSecret(malformedRequest)).toBe(false);
    });

    it("returns false for invalid Bearer token", () => {
      const request = new Request("http://localhost:3000/api/cron/cleanup-tokens", {
        method: "POST",
        headers: { Authorization: "Bearer wrong-secret-value-1234567890" },
      });
      expect(validateCronSecret(request)).toBe(false);
    });

    it("fails closed when CRON_SECRET is missing or shorter than 16 characters", () => {
      // Missing
      delete process.env.CRON_SECRET;
      const req1 = new Request("http://localhost:3000/api/cron/cleanup-tokens", {
        method: "POST",
        headers: { Authorization: "Bearer short" },
      });
      expect(validateCronSecret(req1)).toBe(false);

      // Short (< 16 chars)
      process.env.CRON_SECRET = "short-secret";
      const req2 = new Request("http://localhost:3000/api/cron/cleanup-tokens", {
        method: "POST",
        headers: { Authorization: "Bearer short-secret" },
      });
      expect(validateCronSecret(req2)).toBe(false);
    });

    it("never authenticates when secret is passed only as query parameter", () => {
      const request = new Request(
        `http://localhost:3000/api/cron/cleanup-tokens?secret=${validSecret}`,
        {
          method: "POST",
        }
      );
      expect(validateCronSecret(request)).toBe(false);
    });

    it("authenticates successfully with valid Bearer token", () => {
      const request = new Request("http://localhost:3000/api/cron/cleanup-tokens", {
        method: "POST",
        headers: { Authorization: `Bearer ${validSecret}` },
      });
      expect(validateCronSecret(request)).toBe(true);
    });
  });

  describe("Route Handler: POST /api/cron/cleanup-tokens", () => {
    it("returns 401 and does not invoke Prisma transaction without valid credentials", async () => {
      const request = new Request("http://localhost:3000/api/cron/cleanup-tokens", {
        method: "POST",
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("returns 401 when query parameter ?secret= is supplied without Bearer header", async () => {
      const request = new Request(
        `http://localhost:3000/api/cron/cleanup-tokens?secret=${validSecret}`,
        {
          method: "POST",
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(401);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("executes cleanup transaction with valid credentials, verifying cutoff date and audit log", async () => {
      let executedDeleteWhere: any = null;
      let executedAuditData: any = null;

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          refreshToken: {
            deleteMany: vi.fn().mockImplementation(async (args) => {
              executedDeleteWhere = args.where;
              return { count: 7 };
            }),
          },
          auditLog: {
            create: vi.fn().mockImplementation(async (args) => {
              executedAuditData = args.data;
              return { id: "audit-1" };
            }),
          },
        };
        return callback(mockTx);
      });

      const beforeCall = Date.now();
      const request = new Request("http://localhost:3000/api/cron/cleanup-tokens", {
        method: "POST",
        headers: { Authorization: `Bearer ${validSecret}` },
      });

      const response = await POST(request);
      const afterCall = Date.now();

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({
        success: true,
        message: "Cleaned up 7 refresh tokens expired more than 30 days ago",
        deletedCount: 7,
      });

      // Verify Prisma $transaction was called once
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      // Verify cutoff date is approximately 30 days ago
      expect(executedDeleteWhere).toBeDefined();
      expect(executedDeleteWhere.expiresAt).toBeDefined();
      expect(executedDeleteWhere.expiresAt.lt).toBeInstanceOf(Date);

      const cutoffMs = executedDeleteWhere.expiresAt.lt.getTime();
      const expectedCutoffMin = beforeCall - 30 * 24 * 60 * 60 * 1000 - 1000;
      const expectedCutoffMax = afterCall - 30 * 24 * 60 * 60 * 1000 + 1000;
      expect(cutoffMs).toBeGreaterThanOrEqual(expectedCutoffMin);
      expect(cutoffMs).toBeLessThanOrEqual(expectedCutoffMax);

      // Verify audit log properties
      expect(executedAuditData).toEqual({
        actorId: null,
        action: "CLEANUP_EXPIRED_TOKENS",
        entity: "RefreshToken",
        metadata: {
          deletedCount: 7,
          cutoffDate: executedDeleteWhere.expiresAt.lt.toISOString(),
        },
      });
    });

    it("returns 500 and bubbles up error if audit logging fails in the transaction", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          refreshToken: {
            deleteMany: vi.fn().mockResolvedValue({ count: 5 }),
          },
          auditLog: {
            create: vi.fn().mockRejectedValue(new Error("Database connection dropped during audit log")),
          },
        };
        return callback(mockTx);
      });

      const request = new Request("http://localhost:3000/api/cron/cleanup-tokens", {
        method: "POST",
        headers: { Authorization: `Bearer ${validSecret}` },
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const json = await response.json();
      expect(json).toEqual({ error: "Internal Server Error" });
    });

    it("is safe to execute repeatedly (idempotent runs return 200 with 0 deleted)", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          refreshToken: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
          auditLog: {
            create: vi.fn().mockResolvedValue({ id: "audit-2" }),
          },
        };
        return callback(mockTx);
      });

      const request1 = new Request("http://localhost:3000/api/cron/cleanup-tokens", {
        method: "POST",
        headers: { Authorization: `Bearer ${validSecret}` },
      });
      const response1 = await POST(request1);
      expect(response1.status).toBe(200);
      const json1 = await response1.json();
      expect(json1.deletedCount).toBe(0);

      const request2 = new Request("http://localhost:3000/api/cron/cleanup-tokens", {
        method: "POST",
        headers: { Authorization: `Bearer ${validSecret}` },
      });
      const response2 = await POST(request2);
      expect(response2.status).toBe(200);
      const json2 = await response2.json();
      expect(json2.deletedCount).toBe(0);
    });
  });
});
