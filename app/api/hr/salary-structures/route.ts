import { getAuthUser, hasRole, unauthorized, forbidden } from "@/lib/auth-server";
import { SalaryStructureService } from "@/lib/modules/hr/services/salary-structure.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    if (!hasRole(user, "HR", "ADMIN", "SUPER_ADMIN", "ACCOUNTANT")) {
      return forbidden("Forbidden: Only HR or Finance can view salary structures");
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId") || undefined;
    const department = searchParams.get("department") || undefined;
    const search = searchParams.get("search") || undefined;

    const data = await SalaryStructureService.getSalaryStructures({
      employeeId,
      department,
      search,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching salary structures:", error);
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
      return forbidden("Forbidden: Only HR or Finance can modify salary structures");
    }

    const body = await request.json();
    const { employeeId, effectiveDate, basicSalary, housingAllowance, transportAllowance, otherAllowances, notes } = body;

    if (!employeeId || basicSalary === undefined) {
      return NextResponse.json(
        { error: "Employee ID and Basic Salary are required" },
        { status: 400 }
      );
    }

    const result = await SalaryStructureService.saveSalaryStructure({
      employeeId,
      effectiveDate: effectiveDate || new Date().toISOString().slice(0, 10),
      basicSalary: Number(basicSalary),
      housingAllowance: Number(housingAllowance || 0),
      transportAllowance: Number(transportAllowance || 0),
      otherAllowances: Number(otherAllowances || 0),
      notes,
    });

    return NextResponse.json({ success: true, structure: result }, { status: 201 });
  } catch (error) {
    console.error("Error saving salary structure:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
