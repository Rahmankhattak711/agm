import { getAuthUser, hasRole, unauthorized, forbidden } from "@/lib/auth-server";
import { DocumentVaultService } from "@/lib/modules/hr/services/document-vault.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId") || undefined;
    const documentType = searchParams.get("documentType") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const data = await DocumentVaultService.getVaultDocuments({
      employeeId,
      documentType,
      status,
      search,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching vault documents:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    if (!hasRole(user, "HR", "ADMIN", "SUPER_ADMIN", "ACCOUNTANT")) {
      return forbidden("Forbidden: Only HR or Admins can register compliance documents");
    }

    const body = await request.json();
    const { employeeId, documentType, documentNumber, issueDate, expiryDate, fileName, fileUrl, notes } = body;

    if (!employeeId || !documentType || !documentNumber || !expiryDate) {
      return NextResponse.json(
        { error: "Employee ID, Document Type, Document Number, and Expiry Date are required" },
        { status: 400 }
      );
    }

    const doc = await DocumentVaultService.registerDocument({
      employeeId,
      documentType,
      documentNumber,
      issueDate,
      expiryDate,
      fileName,
      fileUrl,
      notes,
    });

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    if (!hasRole(user, "HR", "ADMIN", "SUPER_ADMIN")) {
      return forbidden("Forbidden: Only HR or Admins can delete compliance documents");
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    await DocumentVaultService.deleteDocument(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
