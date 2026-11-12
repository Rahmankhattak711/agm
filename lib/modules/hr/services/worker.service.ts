import prisma from "@/lib/prisma";

export interface OperationalWorkerDto {
  id: string;
  workerCode: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  department: string;
  designation: string;
  jobCategory: "TECHNICIAN" | "MECHANIC" | "SITE_LABOUR" | "OPERATIONS" | "GENERAL_FIELD";
  joiningDate: string;
  status: string;
  basicSalary: number;
  documents: {
    emiratesId: { number: string | null; expiry: string | null; isExpired: boolean; daysLeft: number | null };
    passport: { number: string | null; expiry: string | null; isExpired: boolean; daysLeft: number | null };
    visa: { number: string | null; expiry: string | null; isExpired: boolean; daysLeft: number | null };
  };
}

export class WorkerService {
  /**
   * Retrieves operational field and floor workers with compliance credentials
   */
  public static async getOperationalWorkers(filter?: {
    category?: string;
    search?: string;
  }): Promise<OperationalWorkerDto[]> {
    // 1. Fetch employees whose designation or department matches operational roles
    const employees = await prisma.employee.findMany({
      orderBy: { employeeCode: "asc" },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        department: true,
        designation: true,
        joiningDate: true,
        employmentStatus: true,
        basicSalary: true,
        emiratesId: true,
        emiratesIdExpiry: true,
        passportNo: true,
        passportExpiry: true,
        visaNumber: true,
        visaExpiry: true,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calculateDaysLeft = (expiryDate: Date | null) => {
      if (!expiryDate) return { isExpired: false, daysLeft: null };
      const exp = new Date(expiryDate);
      exp.setHours(0, 0, 0, 0);
      const diffTime = exp.getTime() - today.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { isExpired: days <= 0, daysLeft: days };
    };

    const workersList: OperationalWorkerDto[] = [];

    for (const emp of employees) {
      const desigLower = (emp.designation || "").toLowerCase();
      const deptLower = (emp.department || "").toLowerCase();

      // Check operational worker classification
      const isMechanic = desigLower.includes("mechanic") || deptLower.includes("maintenance");
      const isTechnician = desigLower.includes("technician") || desigLower.includes("electrician");
      const isLabour = desigLower.includes("labour") || desigLower.includes("helper") || desigLower.includes("worker") || desigLower.includes("loader");
      const isOps = deptLower.includes("operation") || deptLower.includes("workshop") || deptLower.includes("warehouse");

      let jobCategory: OperationalWorkerDto["jobCategory"] = "GENERAL_FIELD";
      if (isTechnician) jobCategory = "TECHNICIAN";
      else if (isMechanic) jobCategory = "MECHANIC";
      else if (isLabour) jobCategory = "SITE_LABOUR";
      else if (isOps) jobCategory = "OPERATIONS";
      else {
        // Office/Admin staff - skip from floor workers list if not matching
        continue;
      }

      const fullName = `${emp.firstName} ${emp.lastName}`.trim();

      // Search match
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        const matches =
          fullName.toLowerCase().includes(q) ||
          emp.employeeCode.toLowerCase().includes(q) ||
          (emp.phone && emp.phone.includes(q)) ||
          desigLower.includes(q) ||
          deptLower.includes(q);
        if (!matches) continue;
      }

      if (filter?.category && filter.category !== "ALL" && jobCategory !== filter.category) {
        continue;
      }

      const eid = calculateDaysLeft(emp.emiratesIdExpiry);
      const pass = calculateDaysLeft(emp.passportExpiry);
      const visa = calculateDaysLeft(emp.visaExpiry);

      workersList.push({
        id: emp.id,
        workerCode: emp.employeeCode,
        fullName,
        email: emp.email,
        phone: emp.phone,
        department: emp.department || "Operations",
        designation: emp.designation || "Operational Worker",
        jobCategory,
        joiningDate: emp.joiningDate ? emp.joiningDate.toISOString().slice(0, 10) : "",
        status: emp.employmentStatus,
        basicSalary: Number(emp.basicSalary || 0),
        documents: {
          emiratesId: {
            number: emp.emiratesId,
            expiry: emp.emiratesIdExpiry ? emp.emiratesIdExpiry.toISOString().slice(0, 10) : null,
            ...eid,
          },
          passport: {
            number: emp.passportNo,
            expiry: emp.passportExpiry ? emp.passportExpiry.toISOString().slice(0, 10) : null,
            ...pass,
          },
          visa: {
            number: emp.visaNumber,
            expiry: emp.visaExpiry ? emp.visaExpiry.toISOString().slice(0, 10) : null,
            ...visa,
          },
        },
      });
    }

    return workersList;
  }
}
