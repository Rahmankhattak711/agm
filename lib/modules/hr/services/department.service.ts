import prisma from "@/lib/prisma";

export interface DepartmentDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  employeeCount: number;
  designationsCount: number;
}

export class DepartmentService {
  /**
   * Retrieves all dynamic departments with employee headcount and designation statistics
   */
  public static async getDepartments(): Promise<DepartmentDto[]> {
    // 1. Fetch active employees to calculate dynamic department counts
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      select: { department: true },
    });

    const countByDept = new Map<string, number>();
    for (const e of employees) {
      if (e.department) {
        const key = e.department.trim().toLowerCase();
        countByDept.set(key, (countByDept.get(key) || 0) + 1);
      }
    }

    // 2. Fetch live departments from database with designations count
    const records = await prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { designations: true },
        },
      },
    });

    return records.map((dept) => {
      const key = dept.name.trim().toLowerCase();
      return {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        description: dept.description,
        isActive: dept.isActive,
        employeeCount: countByDept.get(key) || 0,
        designationsCount: dept._count?.designations || 0,
      };
    });
  }

  /**
   * Creates a new dynamic department in database
   */
  public static async createDepartment(input: { code: string; name: string; description?: string }) {
    const { code, name, description } = input;
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    // Check uniqueness
    const existing = await prisma.department.findFirst({
      where: {
        OR: [
          { code: cleanCode },
          { name: { equals: cleanName, mode: "insensitive" } },
        ],
      },
    });

    if (existing) {
      if (existing.code === cleanCode) {
        throw new Error(`Department code '${cleanCode}' already exists.`);
      }
      throw new Error(`Department with name '${cleanName}' already exists.`);
    }

    return await prisma.department.create({
      data: {
        code: cleanCode,
        name: cleanName,
        description: description?.trim() || null,
        isActive: true,
      },
    });
  }

  /**
   * Updates an existing dynamic department
   */
  public static async updateDepartment(input: {
    id: string;
    code?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  }) {
    const { id, code, name, description, isActive } = input;

    const existing = await prisma.department.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Department not found");
    }

    const cleanCode = code ? code.trim().toUpperCase() : existing.code;
    const cleanName = name ? name.trim() : existing.name;

    // Check code/name conflict with other departments
    const conflict = await prisma.department.findFirst({
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
        throw new Error(`Department code '${cleanCode}' is already taken.`);
      }
      throw new Error(`Department name '${cleanName}' is already taken.`);
    }

    return await prisma.department.update({
      where: { id },
      data: {
        code: cleanCode,
        name: cleanName,
        description: description !== undefined ? description?.trim() || null : existing.description,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });
  }

  /**
   * Deletes a department with enterprise safety integrity checks
   */
  public static async deleteDepartment(id: string) {
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { designations: true },
        },
      },
    });

    if (!dept) {
      throw new Error("Department not found");
    }

    if (dept._count.designations > 0) {
      throw new Error(
        `Cannot delete department '${dept.name}': ${dept._count.designations} designations are assigned to it. Please reassign or delete them first.`
      );
    }

    // Check if active employees belong to this department
    const employeeCount = await prisma.employee.count({
      where: {
        department: { equals: dept.name, mode: "insensitive" },
        isActive: true,
      },
    });

    if (employeeCount > 0) {
      throw new Error(
        `Cannot delete department '${dept.name}': ${employeeCount} active employees are currently assigned to it.`
      );
    }

    return await prisma.department.delete({ where: { id } });
  }
}
