import { getAuthUser, hasRole, unauthorized, forbidden } from "@/lib/auth-server";
import { DepartmentService } from "@/lib/modules/hr/services/department.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const departments = await DepartmentService.getDepartments();
    return NextResponse.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
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
      return forbidden("Forbidden: Only HR or Finance managers can add departments");
    }

    const body = await request.json();
    const { code, name, description } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: "Department code and name are required" },
        { status: 400 }
      );
    }

    const created = await DepartmentService.createDepartment({ code, name, description });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating department:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create department" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    if (!hasRole(user, "HR", "ADMIN", "SUPER_ADMIN", "ACCOUNTANT")) {
      return forbidden("Forbidden: Only HR or Admins can edit departments");
    }

    const body = await request.json();
    const { id, code, name, description, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Department ID is required" }, { status: 400 });
    }

    const updated = await DepartmentService.updateDepartment({ id, code, name, description, isActive });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update department" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    if (!hasRole(user, "HR", "ADMIN", "SUPER_ADMIN")) {
      return forbidden("Forbidden: Only HR or Admins can delete departments");
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Department ID is required" }, { status: 400 });
    }

    await DepartmentService.deleteDepartment(id);
    return NextResponse.json({ ok: true, message: "Department deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete department" },
      { status: 400 }
    );
  }
}
