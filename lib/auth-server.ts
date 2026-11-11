import type { UserRole } from "@/app/generated/prisma";
import { verifyAccessToken } from "@/lib/auth/tokens";
import prisma from "@/lib/prisma";
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  tokenVersion?: number;
  mustChangePassword?: boolean;
}

export function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);

  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const match =
      cookieHeader.match(/access_token=([^;]+)/) ||
      cookieHeader.match(/agm_access_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
}

export async function getAuthUser(
  request: Request,
  options?: { allowMustChangePassword?: boolean },
): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    const payload = await verifyAccessToken(token);
    if (!payload || !payload.sub) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        tokenVersion: true,
        deletedAt: true,
        mustChangePassword: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt) return null;
    if (user.tokenVersion !== payload.v) return null;
    if (user.mustChangePassword && !options?.allowMustChangePassword)
      return null;

    return user;
  } catch {
    return null;
  }
}

export function isAdminRole(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function hasRole(
  actor: AuthUser,
  ...roles: (UserRole | UserRole[])[]
): boolean {
  if (actor.role === "SUPER_ADMIN" || actor.role === "ADMIN") return true;
  const flatRoles = roles.flat();
  return flatRoles.includes(actor.role);
}

export function canModifyResource(
  actor: AuthUser,
  resourceOwnerId?: string | null,
  allowedRoles: UserRole[] = [],
): boolean {
  if (actor.role === "SUPER_ADMIN" || actor.role === "ADMIN") return true;
  if (allowedRoles.length > 0 && allowedRoles.includes(actor.role)) return true;
  if (resourceOwnerId && actor.id === resourceOwnerId) return true;
  return false;
}

export function canManageRole(actor: AuthUser, targetRole: UserRole): boolean {
  if (actor.role === "SUPER_ADMIN") {
    return targetRole !== "SUPER_ADMIN";
  }
  return false;
}

export function canManageUser(actor: AuthUser, target: AuthUser): boolean {
  if (actor.role === "SUPER_ADMIN") {
    return actor.id !== target.id && target.role !== "SUPER_ADMIN";
  }
  return false;
}

export function isSuperAdmin(actor: AuthUser): boolean {
  return actor.role === "SUPER_ADMIN";
}

export function isFinancialUser(actor: AuthUser): boolean {
  return (
    actor.role === "SUPER_ADMIN" ||
    actor.role === "ADMIN" ||
    actor.role === "ACCOUNTANT"
  );
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden(
  message = "Forbidden: You do not have permission to perform this action",
) {
  return NextResponse.json({ error: message }, { status: 403 });
}

export const userSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  mustChangePassword: true,
  lastLoginAt: true,
  tokenVersion: true,
} as const;

export function isHRorAdmin(actor: AuthUser): boolean {
  return (
    actor.role === "SUPER_ADMIN" ||
    actor.role === "ADMIN" ||
    actor.role === "HR"
  );
}

export const publicEmployeeSelect = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  email: true,
  department: true,
  designation: true,
  employmentStatus: true,
  joiningDate: true,
  profilePhotoUrl: true,
  reportsTo: {
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      designation: true,
    },
  },
} as const;

export const selfEmployeeSelect = {
  ...publicEmployeeSelect,
  phone: true,
  dateOfBirth: true,
  gender: true,
  maritalStatus: true,
  nationality: true,
  contractType: true,
  passportExpiry: true,
  visaExpiry: true,
  emiratesIdExpiry: true,
  emergencyContact: true,
  annualLeaveBalance: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type LinkageResult =
  | { status: "MATCH"; employeeId: string; employeeCode: string; email: string | null }
  | { status: "NONE"; reason: string }
  | { status: "AMBIGUOUS"; reason: string };

export async function resolveLinkedEmployee(
  actor: AuthUser,
): Promise<LinkageResult> {
  if (!actor.email) {
    return {
      status: "NONE",
      reason: "Authenticated user has no email address",
    };
  }

  const normalizedEmail = actor.email.trim();

  const matches = await prisma.employee.findMany({
    where: {
      email: {
        equals: normalizedEmail,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      employeeCode: true,
      email: true,
    },
    take: 2,
  });

  if (matches.length === 1) {
    return {
      status: "MATCH",
      employeeId: matches[0].id,
      employeeCode: matches[0].employeeCode,
      email: matches[0].email,
    };
  }

  if (matches.length > 1) {
    return {
      status: "AMBIGUOUS",
      reason:
        "Multiple employee records found matching email. Manual HR linkage required.",
    };
  }

  return {
    status: "NONE",
    reason: "No employee profile found with this email",
  };
}

export const SUPPORTED_COMMERCIAL_DOC_TYPES = [
  "AGREEMENT",
  "SALARY_CERTIFICATE",
  "CUSTOM_LETTER",
  "METHOD_STATEMENT",
  "RISK_ASSESSMENT",
] as const;

export type CommercialDocType =
  (typeof SUPPORTED_COMMERCIAL_DOC_TYPES)[number];

export function isCommercialDocType(
  value: unknown,
): value is CommercialDocType {
  return (
    typeof value === "string" &&
    (SUPPORTED_COMMERCIAL_DOC_TYPES as readonly string[]).includes(value)
  );
}

export function canDeleteCommercialDocument(
  actor: AuthUser,
  doc: { status?: string | null; createdById?: string | null },
  docType: CommercialDocType,
): { allowed: boolean; reason?: string; status: number } {
  // Validate required docType
  if (!isCommercialDocType(docType)) {
    return {
      allowed: false,
      status: 400,
      reason: "Invalid or unsupported commercial document type.",
    };
  }

  const rawStatus = typeof doc.status === "string" ? doc.status.trim() : "";
  const normalizedStatus = rawStatus.toUpperCase();

  // Fail closed: only an exact normalized 'DRAFT' status passes the lifecycle check
  if (normalizedStatus !== "DRAFT") {
    return {
      allowed: false,
      status: 400,
      reason: rawStatus
        ? `Cannot delete finalized document in '${rawStatus}' status. Finalized records must be archived or revoked.`
        : "Cannot delete document: status is missing, invalid or empty.",
    };
  }

  // Salary certificates: Ordinary employee creator cannot delete; only HR or Admins
  if (docType === "SALARY_CERTIFICATE") {
    if (isAdminRole(actor.role) || actor.role === "HR") {
      return { allowed: true, status: 200 };
    }
    return {
      allowed: false,
      status: 403,
      reason: "Forbidden: Only HR or Admins can delete salary certificate drafts.",
    };
  }

  // Other documents: Admin or Document Creator
  if (
    isAdminRole(actor.role) ||
    (doc.createdById && actor.id === doc.createdById)
  ) {
    return { allowed: true, status: 200 };
  }

  return {
    allowed: false,
    status: 403,
    reason: "Forbidden: You are not authorized to delete this draft document.",
  };
}

export function canUpdateCommercialDocument(
  actor: AuthUser,
  doc: { status?: string | null; createdById?: string | null },
  docType: CommercialDocType,
): { allowed: boolean; reason?: string; status: number } {
  // Validate required docType
  if (!isCommercialDocType(docType)) {
    return {
      allowed: false,
      status: 400,
      reason: "Invalid or unsupported commercial document type.",
    };
  }

  const rawStatus = typeof doc.status === "string" ? doc.status.trim() : "";
  const normalizedStatus = rawStatus.toUpperCase();

  // Fail closed: only an exact normalized 'DRAFT' status passes the lifecycle check
  if (normalizedStatus !== "DRAFT") {
    return {
      allowed: false,
      status: 400,
      reason: rawStatus
        ? `Cannot edit finalized document in '${rawStatus}' status. Only DRAFT documents may be edited.`
        : "Cannot edit document: status is missing, invalid or empty.",
    };
  }

  // Salary certificates: Ordinary employee creator cannot edit; only HR or Admins
  if (docType === "SALARY_CERTIFICATE") {
    if (isAdminRole(actor.role) || actor.role === "HR") {
      return { allowed: true, status: 200 };
    }
    return {
      allowed: false,
      status: 403,
      reason: "Forbidden: Only HR or Admins can edit salary certificate drafts.",
    };
  }

  // Other documents: Admin or Document Creator
  if (
    isAdminRole(actor.role) ||
    (doc.createdById && actor.id === doc.createdById)
  ) {
    return { allowed: true, status: 200 };
  }

  return {
    allowed: false,
    status: 403,
    reason: "Forbidden: You are not authorized to edit this draft document.",
  };
}

export function validateCronSecret(request: Request): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret || configuredSecret.length < 16) {
    return false;
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const providedToken = authHeader.slice(7).trim();
  const configuredBuffer = Buffer.from(configuredSecret, "utf-8");
  const providedBuffer = Buffer.from(providedToken, "utf-8");

  if (configuredBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(configuredBuffer, providedBuffer);
}
