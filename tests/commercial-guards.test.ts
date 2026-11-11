import { describe, it, expect } from "vitest";
import {
  canDeleteCommercialDocument,
  canUpdateCommercialDocument,
  isCommercialDocType,
  SUPPORTED_COMMERCIAL_DOC_TYPES,
  AuthUser,
} from "@/lib/auth-server";

describe("Commercial Document Guards: canDeleteCommercialDocument & canUpdateCommercialDocument", () => {
  const superAdmin: AuthUser = {
    id: "user-super-admin",
    email: "superadmin@agm.ae",
    fullName: "Super Admin",
    role: "SUPER_ADMIN",
    isActive: true,
  };

  const admin: AuthUser = {
    id: "user-admin",
    email: "admin@agm.ae",
    fullName: "Admin User",
    role: "ADMIN",
    isActive: true,
  };

  const hrUser: AuthUser = {
    id: "user-hr",
    email: "hr@agm.ae",
    fullName: "HR Specialist",
    role: "HR",
    isActive: true,
  };

  const creatorUser: AuthUser = {
    id: "user-creator",
    email: "creator@agm.ae",
    fullName: "Document Creator",
    role: "USER",
    isActive: true,
  };

  const otherUser: AuthUser = {
    id: "user-other",
    email: "other@agm.ae",
    fullName: "Other Employee",
    role: "USER",
    isActive: true,
  };

  describe("Type guard: isCommercialDocType", () => {
    it.each(SUPPORTED_COMMERCIAL_DOC_TYPES)(
      "returns true for valid document type: %s",
      (validType) => {
        expect(isCommercialDocType(validType)).toBe(true);
      }
    );

    it.each([null, undefined, "", "   ", "INVALID_TYPE", "agreement", 123, {}, []])(
      "returns false for invalid or unnormalized document type: %s",
      (invalidType) => {
        expect(isCommercialDocType(invalidType)).toBe(false);
      }
    );
  });

  describe("Fail-closed status check", () => {
    it.each([null, undefined, "", "   ", "\t\n"])(
      "rejects null, undefined, empty, or whitespace status (%s) for DELETE and UPDATE",
      (falsyStatus) => {
        const doc = { status: falsyStatus, createdById: creatorUser.id };

        const delResult = canDeleteCommercialDocument(superAdmin, doc, "AGREEMENT");
        expect(delResult.allowed).toBe(false);
        expect(delResult.status).toBe(400);

        const updResult = canUpdateCommercialDocument(superAdmin, doc, "AGREEMENT");
        expect(updResult.allowed).toBe(false);
        expect(updResult.status).toBe(400);
      }
    );

    it.each(["ACTIVE", "ISSUED", "COMPLETED", "SIGNED", "APPROVED", "UNKNOWN", "PENDING"])(
      "blocks finalized or unknown status (%s) even for SUPER_ADMIN with 400",
      (finalizedStatus) => {
        const doc = { status: finalizedStatus, createdById: creatorUser.id };

        const delResult = canDeleteCommercialDocument(superAdmin, doc, "AGREEMENT");
        expect(delResult.allowed).toBe(false);
        expect(delResult.status).toBe(400);

        const updResult = canUpdateCommercialDocument(superAdmin, doc, "AGREEMENT");
        expect(updResult.allowed).toBe(false);
        expect(updResult.status).toBe(400);
      }
    );

    it("accepts normalized DRAFT status (case-insensitive and trimmed)", () => {
      const doc = { status: "  draft  ", createdById: creatorUser.id };

      const delResult = canDeleteCommercialDocument(creatorUser, doc, "AGREEMENT");
      expect(delResult.allowed).toBe(true);
      expect(delResult.status).toBe(200);

      const updResult = canUpdateCommercialDocument(creatorUser, doc, "AGREEMENT");
      expect(updResult.allowed).toBe(true);
      expect(updResult.status).toBe(200);
    });
  });

  describe("Required and validated docType", () => {
    it("rejects unsupported or missing docType", () => {
      const doc = { status: "DRAFT", createdById: creatorUser.id };

      // @ts-expect-error Testing invalid runtime docType
      const delResult = canDeleteCommercialDocument(creatorUser, doc, "INVALID_TYPE");
      expect(delResult.allowed).toBe(false);
      expect(delResult.status).toBe(400);

      // @ts-expect-error Testing undefined runtime docType
      const updResult = canUpdateCommercialDocument(creatorUser, doc, undefined);
      expect(updResult.allowed).toBe(false);
      expect(updResult.status).toBe(400);
    });
  });

  describe("Special SALARY_CERTIFICATE restrictions", () => {
    it("denies ordinary employee creator from deleting or editing a salary certificate draft", () => {
      const doc = { status: "DRAFT", createdById: creatorUser.id };

      const delResult = canDeleteCommercialDocument(creatorUser, doc, "SALARY_CERTIFICATE");
      expect(delResult.allowed).toBe(false);
      expect(delResult.status).toBe(403);
      expect(delResult.reason).toContain("Only HR or Admins");

      const updResult = canUpdateCommercialDocument(creatorUser, doc, "SALARY_CERTIFICATE");
      expect(updResult.allowed).toBe(false);
      expect(updResult.status).toBe(403);
      expect(updResult.reason).toContain("Only HR or Admins");
    });

    it("permits HR and Admins to delete or edit a salary certificate draft", () => {
      const doc = { status: "DRAFT", createdById: creatorUser.id };

      expect(canDeleteCommercialDocument(hrUser, doc, "SALARY_CERTIFICATE").allowed).toBe(true);
      expect(canUpdateCommercialDocument(hrUser, doc, "SALARY_CERTIFICATE").allowed).toBe(true);

      expect(canDeleteCommercialDocument(admin, doc, "SALARY_CERTIFICATE").allowed).toBe(true);
      expect(canUpdateCommercialDocument(admin, doc, "SALARY_CERTIFICATE").allowed).toBe(true);

      expect(canDeleteCommercialDocument(superAdmin, doc, "SALARY_CERTIFICATE").allowed).toBe(true);
      expect(canUpdateCommercialDocument(superAdmin, doc, "SALARY_CERTIFICATE").allowed).toBe(true);
    });
  });

  describe("Ownership rules for other document types", () => {
    it.each(["AGREEMENT", "CUSTOM_LETTER", "METHOD_STATEMENT", "RISK_ASSESSMENT"] as const)(
      "permits creator and admins to delete and edit drafts for %s",
      (docType) => {
        const doc = { status: "DRAFT", createdById: creatorUser.id };

        expect(canDeleteCommercialDocument(creatorUser, doc, docType).allowed).toBe(true);
        expect(canUpdateCommercialDocument(creatorUser, doc, docType).allowed).toBe(true);

        expect(canDeleteCommercialDocument(admin, doc, docType).allowed).toBe(true);
        expect(canUpdateCommercialDocument(admin, doc, docType).allowed).toBe(true);
      }
    );

    it.each(["AGREEMENT", "CUSTOM_LETTER", "METHOD_STATEMENT", "RISK_ASSESSMENT"] as const)(
      "denies non-creator ordinary user from deleting or editing draft for %s",
      (docType) => {
        const doc = { status: "DRAFT", createdById: creatorUser.id };

        const delResult = canDeleteCommercialDocument(otherUser, doc, docType);
        expect(delResult.allowed).toBe(false);
        expect(delResult.status).toBe(403);

        const updResult = canUpdateCommercialDocument(otherUser, doc, docType);
        expect(updResult.allowed).toBe(false);
        expect(updResult.status).toBe(403);
      }
    );
  });
});
