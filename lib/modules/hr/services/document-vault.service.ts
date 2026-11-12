import prisma from "@/lib/prisma";

export interface VaultDocumentDto {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  documentType: "EMIRATES_ID" | "PASSPORT" | "RESIDENCE_VISA" | "DRIVING_LICENSE" | "CONTRACT" | "SAFETY_CERTIFICATE" | "OTHER";
  documentNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  fileName: string | null;
  fileUrl: string | null;
  status: "VALID" | "CRITICAL" | "EXPIRING_SOON" | "EXPIRED";
  daysRemaining: number | null;
  notes: string | null;
  isUploadedCopy: boolean;
  uploadedAt?: string | null;
}

export interface DocumentVaultSummary {
  totalDocuments: number;
  validCount: number;
  criticalCount: number; // <= 30 days
  expiringSoonCount: number; // 31-60 days
  expiredCount: number;
}

export class DocumentVaultService {
  /**
   * Assesses expiry status and days remaining
   */
  private static assessExpiry(expDate: Date | null | string): {
    status: VaultDocumentDto["status"];
    daysRemaining: number | null;
  } {
    if (!expDate) return { status: "VALID", daysRemaining: null };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exp = new Date(expDate);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (days <= 0) return { status: "EXPIRED", daysRemaining: days };
    if (days <= 30) return { status: "CRITICAL", daysRemaining: days };
    if (days <= 60) return { status: "EXPIRING_SOON", daysRemaining: days };
    return { status: "VALID", daysRemaining: days };
  }

  /**
   * Retrieves deduplicated active compliance documents across employees with live expiry countdown.
   * Guarantees at most ONE active card per document type per employee!
   */
  public static async getVaultDocuments(filter?: {
    employeeId?: string;
    documentType?: string;
    status?: string;
    search?: string;
  }): Promise<{
    documents: VaultDocumentDto[];
    summary: DocumentVaultSummary;
  }> {
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        ...(filter?.employeeId ? { id: filter.employeeId } : {}),
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        department: true,
        designation: true,
        emiratesId: true,
        emiratesIdExpiry: true,
        passportNo: true,
        passportExpiry: true,
        visaNumber: true,
        visaExpiry: true,
        laborCardNo: true,
        laborCardExpiry: true,
      },
      orderBy: { employeeCode: "asc" },
    });

    // 1. Fetch all uploaded documents from employee_documents table
    let uploadedDocs: any[] = [];
    try {
      uploadedDocs = await (prisma as any).employeeDocument.findMany({
        where: {
          ...(filter?.employeeId ? { employeeId: filter.employeeId } : {}),
          status: "ACTIVE",
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              department: true,
              designation: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      uploadedDocs = [];
    }

    const docs: VaultDocumentDto[] = [];

    // Map uploaded docs by `employeeId_documentType` (newest wins if multiple)
    const uploadedMap = new Map<string, any>();
    for (const ud of uploadedDocs) {
      const key = `${ud.employeeId}_${ud.documentType}`;
      if (!uploadedMap.has(key)) {
        uploadedMap.set(key, ud);
      }
    }

    // 2. Iterate each employee and build clean active credentials
    for (const emp of employees) {
      const fullName = `${emp.firstName} ${emp.lastName}`.trim();
      const dept = emp.department || "Operations";
      const desig = emp.designation || "Staff";

      // -------------------------------------------------------------
      // Helper to add or override a document credential
      // -------------------------------------------------------------
      const processCredential = (
        docType: VaultDocumentDto["documentType"],
        empDocNumber: string | null,
        empExpiryDate: Date | null,
        defaultNotes: string
      ) => {
        const uploadKey = `${emp.id}_${docType}`;
        const realUpload = uploadedMap.get(uploadKey);

        if (realUpload) {
          // Real uploaded document with file attachment takes precedence
          const { status, daysRemaining } = DocumentVaultService.assessExpiry(realUpload.expiryDate);
          docs.push({
            id: realUpload.id,
            employeeId: emp.id,
            employeeCode: emp.employeeCode,
            employeeName: fullName,
            department: dept,
            designation: desig,
            documentType: docType,
            documentNumber: realUpload.documentNumber || empDocNumber,
            issueDate: realUpload.issueDate ? realUpload.issueDate.toISOString().slice(0, 10) : null,
            expiryDate: realUpload.expiryDate ? realUpload.expiryDate.toISOString().slice(0, 10) : null,
            fileName: realUpload.fileName,
            fileUrl: realUpload.fileUrl,
            status,
            daysRemaining,
            notes: realUpload.notes || defaultNotes,
            isUploadedCopy: true,
            uploadedAt: realUpload.createdAt ? realUpload.createdAt.toISOString() : null,
          });
          // Mark as consumed
          uploadedMap.delete(uploadKey);
        } else if (empDocNumber || empExpiryDate) {
          // Synthetic record only if no uploaded file exists
          const { status, daysRemaining } = DocumentVaultService.assessExpiry(empExpiryDate);
          docs.push({
            id: `${docType.toLowerCase()}_${emp.id}`,
            employeeId: emp.id,
            employeeCode: emp.employeeCode,
            employeeName: fullName,
            department: dept,
            designation: desig,
            documentType: docType,
            documentNumber: empDocNumber,
            issueDate: null,
            expiryDate: empExpiryDate ? empExpiryDate.toISOString().slice(0, 10) : null,
            fileName: null,
            fileUrl: null,
            status,
            daysRemaining,
            notes: defaultNotes,
            isUploadedCopy: false,
            uploadedAt: null,
          });
        }
      };

      // A. Emirates ID
      processCredential("EMIRATES_ID", emp.emiratesId, emp.emiratesIdExpiry, "UAE Federal Identity Document");

      // B. Passport
      processCredential("PASSPORT", emp.passportNo, emp.passportExpiry, "National Passport Document");

      // C. Residence Visa
      processCredential("RESIDENCE_VISA", emp.visaNumber, emp.visaExpiry, "UAE Residence Employment Visa");

      // D. Labor Contract
      processCredential("CONTRACT", emp.laborCardNo, emp.laborCardExpiry, "MOHRE UAE Labor Card");
    }

    // 3. Any additional uploaded document types (e.g. SAFETY_CERTIFICATE, OTHER)
    for (const [_, extra] of uploadedMap.entries()) {
      const { status, daysRemaining } = DocumentVaultService.assessExpiry(extra.expiryDate);
      docs.push({
        id: extra.id,
        employeeId: extra.employeeId,
        employeeCode: extra.employee?.employeeCode || "EMP",
        employeeName: extra.employee ? `${extra.employee.firstName} ${extra.employee.lastName}`.trim() : "Staff",
        department: extra.employee?.department || "Operations",
        designation: extra.employee?.designation || "Staff",
        documentType: extra.documentType,
        documentNumber: extra.documentNumber,
        issueDate: extra.issueDate ? extra.issueDate.toISOString().slice(0, 10) : null,
        expiryDate: extra.expiryDate ? extra.expiryDate.toISOString().slice(0, 10) : null,
        fileName: extra.fileName,
        fileUrl: extra.fileUrl,
        status,
        daysRemaining,
        notes: extra.notes || "Compliance Document",
        isUploadedCopy: true,
        uploadedAt: extra.createdAt ? extra.createdAt.toISOString() : null,
      });
    }

    // 4. Calculate Summary KPIs
    let validCount = 0;
    let criticalCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    for (const d of docs) {
      if (d.status === "VALID") validCount++;
      else if (d.status === "CRITICAL") criticalCount++;
      else if (d.status === "EXPIRING_SOON") expiringSoonCount++;
      else if (d.status === "EXPIRED") expiredCount++;
    }

    // 5. Apply User Filters
    let filteredDocs = docs;

    if (filter?.documentType && filter.documentType !== "ALL") {
      filteredDocs = filteredDocs.filter((d) => d.documentType === filter.documentType);
    }

    if (filter?.status && filter.status !== "ALL") {
      filteredDocs = filteredDocs.filter((d) => d.status === filter.status);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      filteredDocs = filteredDocs.filter(
        (d) =>
          d.employeeName.toLowerCase().includes(q) ||
          d.employeeCode.toLowerCase().includes(q) ||
          (d.documentNumber && d.documentNumber.toLowerCase().includes(q)) ||
          d.department.toLowerCase().includes(q) ||
          d.designation.toLowerCase().includes(q)
      );
    }

    // 6. Sort by urgent expiry first (expired and critical at top)
    filteredDocs.sort((a, b) => {
      const aVal = a.daysRemaining ?? 99999;
      const bVal = b.daysRemaining ?? 99999;
      return aVal - bVal;
    });

    return {
      documents: filteredDocs,
      summary: {
        totalDocuments: docs.length,
        validCount,
        criticalCount,
        expiringSoonCount,
        expiredCount,
      },
    };
  }

  /**
   * Registers a new document, archiving any older version of the same type to prevent duplicates,
   * and synchronizing dates back to the Employee master table.
   */
  public static async registerDocument(input: {
    employeeId: string;
    documentType: string;
    documentNumber: string;
    issueDate?: string;
    expiryDate: string;
    fileName?: string;
    fileUrl?: string;
    notes?: string;
  }) {
    const { employeeId, documentType, documentNumber, issueDate, expiryDate, fileName, fileUrl, notes } = input;
    const exp = new Date(expiryDate);
    const iss = issueDate ? new Date(issueDate) : null;

    // 1. Synchronize back to employee base table if standard UAE document
    if (documentType === "EMIRATES_ID") {
      await prisma.employee.update({
        where: { id: employeeId },
        data: { emiratesId: documentNumber, emiratesIdExpiry: exp },
      });
    } else if (documentType === "PASSPORT") {
      await prisma.employee.update({
        where: { id: employeeId },
        data: { passportNo: documentNumber, passportExpiry: exp },
      });
    } else if (documentType === "RESIDENCE_VISA") {
      await prisma.employee.update({
        where: { id: employeeId },
        data: { visaNumber: documentNumber, visaExpiry: exp },
      });
    } else if (documentType === "CONTRACT") {
      await prisma.employee.update({
        where: { id: employeeId },
        data: { laborCardNo: documentNumber, laborCardExpiry: exp },
      });
    }

    // 2. Mark any prior ACTIVE documents of this type for this employee as SUPERSEDED (Renewal History)
    try {
      await (prisma as any).employeeDocument.updateMany({
        where: {
          employeeId,
          documentType,
          status: "ACTIVE",
        },
        data: {
          status: "SUPERSEDED",
        },
      });
    } catch {
      // Ignore if table not ready
    }

    // 3. Create the new ACTIVE document
    try {
      return await (prisma as any).employeeDocument.create({
        data: {
          employeeId,
          documentType,
          documentNumber,
          issueDate: iss,
          expiryDate: exp,
          fileName,
          fileUrl,
          status: "ACTIVE",
          notes,
        },
      });
    } catch {
      return {
        id: `doc_${Date.now()}`,
        employeeId,
        documentType,
        documentNumber,
        issueDate,
        expiryDate,
        fileName,
        fileUrl,
        status: "ACTIVE",
        notes,
      };
    }
  }

  /**
   * Deletes a document record and cleans up
   */
  public static async deleteDocument(id: string) {
    if (id.startsWith("eid_") || id.startsWith("pass_") || id.startsWith("visa_") || id.startsWith("labor_")) {
      // It's a synthetic reference from the employee table
      const parts = id.split("_");
      const type = parts[0];
      const employeeId = parts.slice(1).join("_");

      if (type === "eid") {
        await prisma.employee.update({
          where: { id: employeeId },
          data: { emiratesId: null, emiratesIdExpiry: null },
        });
      } else if (type === "pass") {
        await prisma.employee.update({
          where: { id: employeeId },
          data: { passportNo: null, passportExpiry: null },
        });
      } else if (type === "visa") {
        await prisma.employee.update({
          where: { id: employeeId },
          data: { visaNumber: null, visaExpiry: null },
        });
      } else if (type === "labor") {
        await prisma.employee.update({
          where: { id: employeeId },
          data: { laborCardNo: null, laborCardExpiry: null },
        });
      }
      return { success: true };
    }

    // Real document in database
    return await (prisma as any).employeeDocument.delete({
      where: { id },
    });
  }
}
