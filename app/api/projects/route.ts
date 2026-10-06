import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const customerId = searchParams.get("customerId") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { projectCode: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        {
          customer: { customerCode: { contains: search, mode: "insensitive" } },
        },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            name: true,
            companyName: true,
            phone: true,
            email: true,
          },
        },
        quotation: {
          select: {
            id: true,
            quotationNo: true,
            customer: true,
            totalAmount: true,
            status: true,
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        costs: {
          orderBy: { date: "desc" },
        },
        _count: {
          select: {
            costs: true,
            milestones: true,
          },
        },
      },
    });

    const salesInvoices = await prisma.salesInvoice.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        invoiceNumber: true,
        customerId: true,
        customerName: true,
        quotationRef: true,
        projectScope: true,
        subtotal: true,
        totalAmount: true,
        items: {
          select: {
            totalAmount: true,
          },
        },
      },
    });

    const cleanProjName = (name: string) =>
      name.replace(/\s*\((AGM-QTN-[^)]+|QTN-[^)]+)\)\s*/i, "").trim().toLowerCase();

    const mappedProjects = projects.map((p) => {
      const sumCosts = p.costs?.reduce((sum, c) => sum + Number(c.amount || 0), 0) ?? 0;
      const actualCost = p.costs && p.costs.length > 0 ? sumCosts : Number(p.actualCost || 0);

      const pClean = cleanProjName(p.name);
      const projNum = p.projectCode.match(/\d+$/)?.[0];

      let matchingInv = salesInvoices.find((inv) => {
        if (p.description && p.description.includes(inv.invoiceNumber)) return true;
        const invNum = inv.invoiceNumber.match(/\d+$/)?.[0];
        if (projNum && invNum && projNum === invNum) return true;
        return false;
      });

      if (!matchingInv && pClean) {
        matchingInv = salesInvoices.find((inv) => {
          if (!inv.projectScope) return false;
          const invScope = inv.projectScope.trim().toLowerCase();
          return invScope === pClean;
        });
      }

      if (!matchingInv && pClean) {
        matchingInv = salesInvoices.find((inv) => {
          if (!inv.projectScope) return false;
          const invScope = inv.projectScope.trim().toLowerCase();
          const scopeMatch = invScope.includes(pClean) || pClean.includes(invScope);
          const custMatch =
            !p.customer?.name ||
            (inv.customerName &&
              inv.customerName.toLowerCase() === p.customer.name.toLowerCase());
          return scopeMatch && custMatch;
        });
      }

      if (!matchingInv && p.quotation?.quotationNo) {
        matchingInv = salesInvoices.find(
          (inv) =>
            inv.quotationRef?.toLowerCase() ===
            p.quotation?.quotationNo?.toLowerCase(),
        );
      }

      const itemsSum = matchingInv?.items?.reduce(
        (sum, item) => sum + Number(item.totalAmount || 0),
        0,
      );
      const matchedInvAmount = itemsSum || (matchingInv ? Number(matchingInv.subtotal || matchingInv.totalAmount) : 0);
      const contractValue = matchedInvAmount || Number(p.contractValue || p.budget || p.quotation?.totalAmount || 0);
      const budget = matchedInvAmount || Number(p.budget || contractValue || 0);

      return {
        ...p,
        actualCost,
        contractValue,
        budget,
      };
    });

    return NextResponse.json(mappedProjects);
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const body = await request.json();
    const {
      name,
      description,
      status = "PLANNING",
      priority = "MEDIUM",
      location,
      startDate,
      endDate,
      deadline,
      contractValue,
      budget,
      estimatedCost,
      quotationId,
      customerId,
      managerId,
      milestones,
    } = body;

    let finalName = name;
    let finalLocation = location;
    let finalContractValue = contractValue ? Number(contractValue) : 0;
    let finalCustomerId = customerId || null;
    let finalBudget = budget ? Number(budget) : 0;

    if (quotationId) {
      const quotation = await prisma.quotation.findUnique({
        where: { id: quotationId },
      });
      if (quotation) {
        if (!finalName) {
          finalName = quotation.project
            ? `${quotation.project} (${quotation.quotationNo})`
            : `Project ${quotation.quotationNo}`;
        }
        if (!finalLocation && quotation.location) {
          finalLocation = quotation.location;
        }
        if (!contractValue && quotation.totalAmount) {
          finalContractValue = Number(quotation.totalAmount);
        }
        if (!finalBudget && quotation.totalAmount) {
          finalBudget = Number(quotation.totalAmount);
        }
        if (!finalCustomerId && quotation.customerId) {
          finalCustomerId = quotation.customerId;
        }
      }
    }

    if (!finalBudget && finalContractValue) {
      finalBudget = finalContractValue;
    }
    if (!finalContractValue && finalBudget) {
      finalContractValue = finalBudget;
    }

    if (!finalName || !finalName.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 },
      );
    }

    const year = new Date().getFullYear();
    const projectCount = await prisma.project.count();
    const projectCode =
      body.projectCode ||
      `PRJ-${year}-${String(projectCount + 1).padStart(4, "0")}`;

    const project = await prisma.project.create({
      data: {
        projectCode,
        name: finalName.trim(),
        description: description?.trim() || null,
        status,
        priority,
        location: finalLocation?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        contractValue: finalContractValue,
        budget: finalBudget,
        estimatedCost: estimatedCost ? Number(estimatedCost) : 0,
        actualCost: 0,
        materialCost: 0,
        laborCost: 0,
        otherExpenses: 0,
        progressPct: body.progressPct ? Number(body.progressPct) : 0,
        quotationId: quotationId || null,
        customerId: finalCustomerId,
        managerId: managerId || null,
        createdById: authUser.id,
        milestones:
          Array.isArray(milestones) && milestones.length > 0
            ? {
                create: milestones.map((m: any, idx: number) => ({
                  title: m.title || `Milestone ${idx + 1}`,
                  description: m.description || null,
                  order: m.order || idx + 1,
                  status: m.status || "NOT_STARTED",
                  progressPct: m.progressPct || 0,
                  dueDate: m.dueDate ? new Date(m.dueDate) : null,
                  billedAmount: m.billedAmount ? Number(m.billedAmount) : null,
                })),
              }
            : undefined,
      },
      include: {
        customer: true,
        quotation: true,
        manager: true,
        milestones: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create project" },
      { status: 500 },
    );
  }
}
