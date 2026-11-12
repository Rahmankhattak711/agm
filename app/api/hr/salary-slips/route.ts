import {
  getAuthUser,
  hasRole,
  unauthorized,
  forbidden,
  resolveLinkedEmployee,
} from "@/lib/auth-server";
import { SalarySlipService } from "@/lib/modules/hr/services/salary-slip.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : now.getMonth() + 1;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : now.getFullYear();
    let employeeId = searchParams.get("employeeId") || undefined;
    const search = searchParams.get("search") || undefined;

    const isHrOrFinance = hasRole(user, "SUPER_ADMIN", "ADMIN", "HR_MANAGER", "HR", "ACCOUNTANT");

    if (!isHrOrFinance) {
      // Non-privileged users can only access their own salary slips
      const linkage = await resolveLinkedEmployee(user);
      if (linkage.status !== "MATCH") {
        return forbidden("Forbidden: No linked employee profile found");
      }

      if (employeeId && employeeId !== linkage.employeeId) {
        return forbidden("Forbidden: You can only view your own salary slip");
      }

      employeeId = linkage.employeeId;
    }

    const slips = await SalarySlipService.getSalarySlips({
      month,
      year,
      employeeId,
      search,
    });

    return NextResponse.json(slips);
  } catch (error) {
    console.error("Error fetching salary slips:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
