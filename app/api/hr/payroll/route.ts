import { getAuthUser, hasRole, unauthorized, forbidden } from "@/lib/auth-server";
import { PayrollEngineService } from "@/lib/modules/hr/services/payroll-engine.service";
import { PayrollLedgerIntegrationService } from "@/lib/modules/hr/services/payroll-ledger-integration.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    if (!hasRole(user, "HR", "ADMIN", "SUPER_ADMIN", "ACCOUNTANT")) {
      return forbidden("Forbidden: Only HR or Finance can view payroll batches");
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : now.getMonth() + 1;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : now.getFullYear();

    const batch = await PayrollEngineService.getPayrollBatch(month, year);
    return NextResponse.json(batch);
  } catch (error) {
    console.error("Error fetching payroll batch:", error);
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
      return forbidden("Forbidden: Only HR or Finance can process payroll state transitions");
    }

    const body = await request.json();
    const { month, year, status } = body;

    if (!month || !year || !["REVIEWED", "APPROVED", "PAID"].includes(status)) {
      return NextResponse.json(
        { error: "Valid month, year, and status ('REVIEWED' | 'APPROVED' | 'PAID') are required" },
        { status: 400 }
      );
    }

    const updated = await PayrollEngineService.updateBatchStatus(
      Number(month),
      Number(year),
      status,
      user.id
    );

    // Sync directly with Finance & General Ledger on Approved or Paid
    try {
      const batchDetails = await PayrollEngineService.getPayrollBatch(Number(month), Number(year));
      if (status === "APPROVED") {
        await PayrollLedgerIntegrationService.postPayrollApprovalEntry({
          month: Number(month),
          year: Number(year),
          batchNumber: batchDetails.batchNumber,
          totalGrossPayroll: batchDetails.totalGrossPayroll,
          totalBasicSalary: batchDetails.totalBasicSalary,
          totalHousingAllowance: batchDetails.totalHousingAllowance,
          totalTransportAllowance: batchDetails.totalTransportAllowance,
          totalOvertimeAmount: batchDetails.totalOvertimeAmount,
          totalDeductions: batchDetails.totalDeductions,
          totalNetPayroll: batchDetails.totalNetPayroll,
          userId: user.id,
        });
      } else if (status === "PAID") {
        await PayrollLedgerIntegrationService.postPayrollDisbursementEntry({
          month: Number(month),
          year: Number(year),
          batchNumber: batchDetails.batchNumber,
          totalNetPayroll: batchDetails.totalNetPayroll,
          userId: user.id,
        });
      }
    } catch (glError: any) {
      console.error("[Payroll GL Posting Error]:", glError);
      return NextResponse.json(
        { error: `Payroll GL posting failed: ${glError.message || "Unknown error"}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, batch: updated });
  } catch (error) {
    console.error("Error updating payroll status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
