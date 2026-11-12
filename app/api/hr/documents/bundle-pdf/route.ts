export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  getAuthUser,
  hasRole,
  unauthorized,
  forbidden,
  resolveLinkedEmployee,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { DocumentVaultService } from "@/lib/modules/hr/services/document-vault.service";
import { buildEmployeeDossierPdf } from "@/lib/pdf/dossier-builder";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const { employeeId, selectedDocumentIds } = body;

    if (!employeeId) {
      return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
    }

    const isHrOrAdmin = hasRole(user, "SUPER_ADMIN", "ADMIN", "HR_MANAGER", "HR");
    if (!isHrOrAdmin) {
      const linkage = await resolveLinkedEmployee(user);
      if (linkage.status !== "MATCH" || linkage.employeeId !== employeeId) {
        return forbidden("Forbidden: You cannot export dossiers of other employees");
      }
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        department: true,
        designation: true,
        email: true,
        phone: true,
        employmentStatus: true,
        joiningDate: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Fetch active vault documents for this employee
    const vault = await DocumentVaultService.getVaultDocuments({ employeeId });
    let docs = vault.documents;

    // Filter to selectedDocumentIds if provided and non-empty
    if (Array.isArray(selectedDocumentIds) && selectedDocumentIds.length > 0) {
      docs = docs.filter((d) => selectedDocumentIds.includes(d.id));
    }

    const employeeFullName = `${employee.firstName} ${employee.lastName}`.trim();
    const joiningDateStr = employee.joiningDate
      ? new Date(employee.joiningDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

    const pdfBytes = await buildEmployeeDossierPdf(
      {
        employeeCode: employee.employeeCode,
        fullName: employeeFullName,
        department: employee.department || "Operations",
        designation: employee.designation || "Staff",
        joiningDate: joiningDateStr,
        email: employee.email || undefined,
        phone: employee.phone || undefined,
        employmentStatus: employee.employmentStatus || "ACTIVE",
      },
      docs.map((d) => ({
        id: d.id,
        documentType: d.documentType,
        documentNumber: d.documentNumber,
        issueDate: d.issueDate,
        expiryDate: d.expiryDate,
        status: d.status,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        notes: d.notes,
      }))
    );

    const safeName = employeeFullName.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${employee.employeeCode}_${safeName}_Compliance_Dossier.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBytes.byteLength.toString(),
      },
    });
  } catch (err: any) {
    console.error("Error generating dossier PDF:", err);
    return NextResponse.json(
      { error: "Failed to generate compliance dossier" },
      { status: 500 }
    );
  }
}
