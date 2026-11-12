import prisma from "@/lib/prisma";

export interface DesignationDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  departmentId: string | null;
  departmentName: string;
  isFieldWorker: boolean;
  isActive: boolean;
  employeeCount: number;
}

export class DesignationService {
  /**
   * Retrieves all dynamic designations with field worker categorization and employee counts
   */
  public static async getDesignations(): Promise<DesignationDto[]> {
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      select: { designation: true },
    });

    const countByDesig = new Map<string, number>();
    for (const e of employees) {
      if (e.designation) {
        const key = e.designation.trim().toLowerCase();
        countByDesig.set(key, (countByDesig.get(key) || 0) + 1);
      }
    }

    const records = await prisma.designation.findMany({
      orderBy: { name: "asc" },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return records.map((d) => {
      const key = d.name.trim().toLowerCase();
      return {
        id: d.id,
        code: d.code,
        name: d.name,
        description: d.description,
        departmentId: d.departmentId,
        departmentName: d.department?.name || "General",
        isFieldWorker: d.isFieldWorker,
        isActive: d.isActive,
        employeeCount: countByDesig.get(key) || 0,
      };
    });
  }

  /**
   * Creates a new dynamic designation
   */
  public static async createDesignation(input: {
    code: string;
    name: string;
    departmentId?: string;
    isFieldWorker?: boolean;
    description?: string;
  }) {
    const { code, name, departmentId, isFieldWorker = false, description } = input;
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    // Check code/name conflict
    const existing = await prisma.designation.findFirst({
      where: {
        OR: [
          { code: cleanCode },
          { name: { equals: cleanName, mode: "insensitive" } },
        ],
      },
    });

    if (existing) {
      if (existing.code === cleanCode) {
        throw new Error(`Designation code '${cleanCode}' already exists.`);
      }
      throw new Error(`Designation with name '${cleanName}' already exists.`);
    }

    return await prisma.designation.create({
      data: {
        code: cleanCode,
        name: cleanName,
        departmentId: departmentId || null,
        isFieldWorker: Boolean(isFieldWorker),
        description: description?.trim() || null,
        isActive: true,
      },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  /**
   * Updates an existing designation
   */
  public static async updateDesignation(input: {
    id: string;
    code?: string;
    name?: string;
    departmentId?: string;
    isFieldWorker?: boolean;
    description?: string;
    isActive?: boolean;
  }) {
    const { id, code, name, departmentId, isFieldWorker, description, isActive } = input;

    const existing = await prisma.designation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Designation not found");
    }

    const cleanCode = code ? code.trim().toUpperCase() : existing.code;
    const cleanName = name ? name.trim() : existing.name;

    const conflict = await prisma.designation.findFirst({
      where: {
        id: { not: id },
        OR: [
          { code: cleanCode },
          { name: { equals: cleanName, mode: "insensitive" } },
        ],
      },
    });

    if (conflict) {
      if (conflict.code === cleanCode) {
        throw new Error(`Designation code '${cleanCode}' is already taken.`);
      }
      throw new Error(`Designation name '${cleanName}' is already taken.`);
    }

    return await prisma.designation.update({
      where: { id },
      data: {
        code: cleanCode,
        name: cleanName,
        departmentId: departmentId !== undefined ? departmentId || null : existing.departmentId,
        isFieldWorker: isFieldWorker !== undefined ? Boolean(isFieldWorker) : existing.isFieldWorker,
        description: description !== undefined ? description?.trim() || null : existing.description,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  /**
   * Deletes a designation with employee safeguard checks
   */
  public static async deleteDesignation(id: string) {
    const desig = await prisma.designation.findUnique({
      where: { id },
    });

    if (!desig) {
      throw new Error("Designation not found");
    }

    // Check if active employees have this designation
    const employeeCount = await prisma.employee.count({
      where: {
        designation: { equals: desig.name, mode: "insensitive" },
        isActive: true,
      },
    });

    if (employeeCount > 0) {
      throw new Error(
        `Cannot delete designation '${desig.name}': ${employeeCount} active employees currently hold this role.`
      );
    }

    return await prisma.designation.delete({ where: { id } });
  }
}
