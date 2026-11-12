import { getAuthUser, hasRole, unauthorized, forbidden } from "@/lib/auth-server";
import { DesignationService } from "@/lib/modules/hr/services/designation.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const designations = await DesignationService.getDesignations();
    return NextResponse.json(designations);
  } catch (error) {
    console.error("Error fetching designations:", error);
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
      return forbidden("Forbidden: Only HR or Finance managers can add designations");
    }

    const body = await request.json();
    const { code, name, departmentId, isFieldWorker, description } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: "Designation code and name are required" },
        { status: 400 }
      );
    }

    const created = await DesignationService.createDesignation({
      code,
      name,
      departmentId,
      isFieldWorker,
      description,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating designation:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create designation" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    if (!hasRole(user, "HR", "ADMIN", "SUPER_ADMIN", "ACCOUNTANT")) {
      return forbidden("Forbidden: Only HR or Admins can edit designations");
    }

    const body = await request.json();
    const { id, code, name, departmentId, isFieldWorker, description, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Designation ID is required" }, { status: 400 });
    }

    const updated = await DesignationService.updateDesignation({
      id,
      code,
      name,
      departmentId,
      isFieldWorker,
      description,
      isActive,
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating designation:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update designation" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    if (!hasRole(user, "HR", "ADMIN", "SUPER_ADMIN")) {
      return forbidden("Forbidden: Only HR or Admins can delete designations");
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Designation ID is required" }, { status: 400 });
    }

    await DesignationService.deleteDesignation(id);
    return NextResponse.json({ ok: true, message: "Designation deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting designation:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete designation" },
      { status: 400 }
    );
  }
}
