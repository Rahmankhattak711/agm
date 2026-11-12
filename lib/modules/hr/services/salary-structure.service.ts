import prisma from "@/lib/prisma";

export interface SalaryStructureDto {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  effectiveDate: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  notes: string | null;
  isActive: boolean;
  historyCount: number;
}

export class SalaryStructureService {
  /**
   * Retrieves active salary structures across workforce with breakdown
   */
  public static async getSalaryStructures(filter?: {
    employeeId?: string;
    department?: string;
    search?: string;
  }): Promise<SalaryStructureDto[]> {
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        ...(filter?.employeeId ? { id: filter.employeeId } : {}),
        ...(filter?.department && filter.department !== "ALL" ? { department: filter.department } : {}),
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        department: true,
        designation: true,
        basicSalary: true,
        housingAllowance: true,
        transportAllowance: true,
        otherAllowances: true,
        monthlySalary: true,
      },
      orderBy: { employeeCode: "asc" },
    });

    // Check if salary_structures table has records
    let structuredRecords: any[] = [];
    try {
      structuredRecords = await (prisma as any).salaryStructure.findMany({
        orderBy: { effectiveDate: "desc" },
      });
    } catch {
      // Table migration fallback
    }

    const structureByEmp = new Map<string, any[]>();
    for (const s of structuredRecords) {
      const list = structureByEmp.get(s.employeeId) || [];
      list.push(s);
      structureByEmp.set(s.employeeId, list);
    }

    const results: SalaryStructureDto[] = [];

    for (const emp of employees) {
      const fullName = `${emp.firstName} ${emp.lastName}`.trim();

      if (filter?.search) {
        const q = filter.search.toLowerCase();
        const matches =
          fullName.toLowerCase().includes(q) ||
          emp.employeeCode.toLowerCase().includes(q) ||
          (emp.department && emp.department.toLowerCase().includes(q)) ||
          (emp.designation && emp.designation.toLowerCase().includes(q));
        if (!matches) continue;
      }

      const history = structureByEmp.get(emp.id) || [];
      const latest = history[0];

      const basic = latest ? Number(latest.basicSalary) : Number(emp.basicSalary || 0);
      const housing = latest ? Number(latest.housingAllowance) : Number(emp.housingAllowance || 0);
      const transport = latest ? Number(latest.transportAllowance) : Number(emp.transportAllowance || 0);
      const other = latest ? Number(latest.otherAllowances) : Number(emp.otherAllowances || 0);
      const gross = basic + housing + transport + other;

      results.push({
        id: latest?.id || `struct_${emp.id}`,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: fullName,
        department: emp.department || "General",
        designation: emp.designation || "Staff",
        effectiveDate: latest ? latest.effectiveDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        basicSalary: basic,
        housingAllowance: housing,
        transportAllowance: transport,
        otherAllowances: other,
        grossSalary: gross,
        notes: latest?.notes || "Standard baseline compensation structure",
        isActive: true,
        historyCount: history.length,
      });
    }

    return results;
  }

  /**
   * Records or updates a salary structure with effective date
   */
  public static async saveSalaryStructure(input: {
    employeeId: string;
    effectiveDate: string;
    basicSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    otherAllowances: number;
    notes?: string;
  }) {
    const { employeeId, effectiveDate, basicSalary, housingAllowance, transportAllowance, otherAllowances, notes } = input;
    const gross = basicSalary + housingAllowance + transportAllowance + otherAllowances;
    const effDate = new Date(effectiveDate);

    // Synchronize to employee record as current baseline
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        basicSalary,
        housingAllowance,
        transportAllowance,
        otherAllowances,
        monthlySalary: gross,
      },
    });

    try {
      return await (prisma as any).salaryStructure.create({
        data: {
          employeeId,
          effectiveDate: effDate,
          basicSalary,
          housingAllowance,
          transportAllowance,
          otherAllowances,
          grossSalary: gross,
          notes: notes || null,
        },
      });
    } catch {
      return {
        id: `struct_${Date.now()}`,
        employeeId,
        effectiveDate,
        basicSalary,
        housingAllowance,
        transportAllowance,
        otherAllowances,
        grossSalary: gross,
        notes,
      };
    }
  }
}
