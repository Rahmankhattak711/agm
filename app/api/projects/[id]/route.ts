import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        customer: true,
        quotation: {
          include: {
            items: {
              orderBy: { itemOrder: "asc" },
            },
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
          include: {
            recordedBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        milestones: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

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

    const sumCosts = project.costs?.reduce((sum, c) => sum + Number(c.amount || 0), 0) ?? 0;
    const actualCost = project.costs && project.costs.length > 0 ? sumCosts : Number(project.actualCost || 0);

    const pClean = cleanProjName(project.name);
    const projNum = project.projectCode.match(/\d+$/)?.[0];

    let matchingInv = salesInvoices.find((inv) => {
      if (project.description && project.description.includes(inv.invoiceNumber)) return true;
      const invNum = inv.invoiceNumber.match(/\d+$/)?.[0];
      if (projNum && invNum && projNum === invNum) return true;
      return false;
    });

    if (!matchingInv && pClean) {
      matchingInv = salesInvoices.find((inv) => {
        if (!inv.projectScope) return false;
        return inv.projectScope.trim().toLowerCase() === pClean;
      });
    }

    if (!matchingInv && pClean) {
      matchingInv = salesInvoices.find((inv) => {
        if (!inv.projectScope) return false;
        const invScope = inv.projectScope.trim().toLowerCase();
        const scopeMatch = invScope.includes(pClean) || pClean.includes(invScope);
        const custMatch =
          !project.customer?.name ||
          (inv.customerName &&
            inv.customerName.toLowerCase() === project.customer.name.toLowerCase());
        return scopeMatch && custMatch;
      });
    }

    if (!matchingInv && project.quotation?.quotationNo) {
      matchingInv = salesInvoices.find(
        (inv) =>
          inv.quotationRef?.toLowerCase() ===
          project.quotation?.quotationNo?.toLowerCase(),
      );
    }

    const itemsSum = matchingInv?.items?.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0,
    );
    const matchedInvAmount = itemsSum || (matchingInv ? Number(matchingInv.subtotal || matchingInv.totalAmount) : 0);
    const contractValue = matchedInvAmount || Number(project.contractValue || project.budget || project.quotation?.totalAmount || 0);
    const budget = matchedInvAmount || Number(project.budget || contractValue || 0);

    return NextResponse.json({
      ...project,
      actualCost,
      contractValue,
      budget,
    });
  } catch (error: any) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch project" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined)
      updateData.description = body.description?.trim() || null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.location !== undefined)
      updateData.location = body.location?.trim() || null;
    if (body.startDate !== undefined)
      updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined)
      updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.deadline !== undefined)
      updateData.deadline = body.deadline ? new Date(body.deadline) : null;

    if (body.contractValue !== undefined)
      updateData.contractValue = Number(body.contractValue);
    if (body.budget !== undefined) updateData.budget = Number(body.budget);
    if (body.estimatedCost !== undefined)
      updateData.estimatedCost = Number(body.estimatedCost);
    if (body.progressPct !== undefined)
      updateData.progressPct = Number(body.progressPct);

    if (body.customerId !== undefined)
      updateData.customerId = body.customerId || null;
    if (body.managerId !== undefined)
      updateData.managerId = body.managerId || null;

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        quotation: true,
        manager: true,
        milestones: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { id } = await params;

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete project" },
      { status: 500 },
    );
  }
}
