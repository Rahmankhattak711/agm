import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-server";
import { NextResponse } from "next/server";

async function recalculateProjectCosts(projectId: string) {
  const allCosts = await prisma.projectCost.findMany({
    where: { projectId },
  });

  let materialCost = 0;
  let laborCost = 0;
  let otherExpenses = 0;
  let actualCost = 0;

  for (const c of allCosts) {
    const amt = Number(c.amount || 0);
    actualCost += amt;
    if (c.costType === "MATERIAL") {
      materialCost += amt;
    } else if (c.costType === "LABOR") {
      laborCost += amt;
    } else {
      otherExpenses += amt;
    }
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      actualCost,
      materialCost,
      laborCost,
      otherExpenses,
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { id: projectId } = await params;

    const costs = await prisma.projectCost.findMany({
      where: { projectId },
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
    });

    return NextResponse.json(costs);
  } catch (error: any) {
    console.error("Error fetching project costs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch project costs" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { id: projectId } = await params;
    const body = await request.json();

    const items = Array.isArray(body)
      ? body
      : Array.isArray(body.items)
        ? body.items
        : null;

    if (items && items.length > 0) {
      const createdCosts = [];
      for (const item of items) {
        if (!item.description || !item.description.trim()) continue;
        let finalAmount = item.amount !== undefined ? Number(item.amount) : 0;
        if (item.quantity && item.unitRate && !item.amount) {
          finalAmount = Number(item.quantity) * Number(item.unitRate);
        }
        const cost = await prisma.projectCost.create({
          data: {
            projectId,
            costType: item.costType || "OTHER",
            category: item.category?.trim() || null,
            description: item.description.trim(),
            quantity:
              item.quantity !== undefined &&
              item.quantity !== null &&
              item.quantity !== ""
                ? Number(item.quantity)
                : null,
            unitRate:
              item.unitRate !== undefined &&
              item.unitRate !== null &&
              item.unitRate !== ""
                ? Number(item.unitRate)
                : null,
            amount: finalAmount,
            date: item.date ? new Date(item.date) : new Date(),
            reference: item.reference?.trim() || null,
            notes: item.notes?.trim() || null,
            recordedById: authUser.id,
          },
        });
        createdCosts.push(cost);
      }
      await recalculateProjectCosts(projectId);
      return NextResponse.json(createdCosts, { status: 201 });
    }

    const {
      costType = "OTHER",
      category,
      description,
      quantity,
      unitRate,
      amount,
      date,
      reference,
      notes,
    } = body;

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 },
      );
    }

    let finalAmount =
      amount !== undefined && amount !== "" ? Number(amount) : 0;
    if (quantity && unitRate && !amount) {
      finalAmount = Number(quantity) * Number(unitRate);
    }

    const cost = await prisma.projectCost.create({
      data: {
        projectId,
        costType,
        category: category?.trim() || null,
        description: description.trim(),
        quantity:
          quantity !== undefined && quantity !== null && quantity !== ""
            ? Number(quantity)
            : null,
        unitRate:
          unitRate !== undefined && unitRate !== null && unitRate !== ""
            ? Number(unitRate)
            : null,
        amount: finalAmount,
        date: date ? new Date(date) : new Date(),
        reference: reference?.trim() || null,
        notes: notes?.trim() || null,
        recordedById: authUser.id,
      },
      include: {
        recordedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    await recalculateProjectCosts(projectId);

    return NextResponse.json(cost, { status: 201 });
  } catch (error: any) {
    console.error("Error adding project cost:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add project cost" },
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

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const costId = searchParams.get("costId");

    if (!costId) {
      return NextResponse.json(
        { error: "costId query parameter is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      costType,
      category,
      description,
      quantity,
      unitRate,
      amount,
      date,
      reference,
      notes,
    } = body;

    let finalAmount =
      amount !== undefined && amount !== "" ? Number(amount) : undefined;
    if (
      quantity !== undefined &&
      unitRate !== undefined &&
      (amount === undefined || amount === "")
    ) {
      finalAmount = Number(quantity) * Number(unitRate);
    }

    const updated = await prisma.projectCost.update({
      where: { id: costId, projectId },
      data: {
        ...(costType ? { costType } : {}),
        ...(category !== undefined
          ? { category: category?.trim() || null }
          : {}),
        ...(description ? { description: description.trim() } : {}),
        ...(quantity !== undefined
          ? {
              quantity:
                quantity !== null && quantity !== "" ? Number(quantity) : null,
            }
          : {}),
        ...(unitRate !== undefined
          ? {
              unitRate:
                unitRate !== null && unitRate !== "" ? Number(unitRate) : null,
            }
          : {}),
        ...(finalAmount !== undefined ? { amount: finalAmount } : {}),
        ...(date ? { date: new Date(date) } : {}),
        ...(reference !== undefined
          ? { reference: reference?.trim() || null }
          : {}),
        ...(notes !== undefined ? { notes: notes?.trim() || null } : {}),
      },
    });

    await recalculateProjectCosts(projectId);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating project cost:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update project cost" },
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

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const costId = searchParams.get("costId");

    if (!costId) {
      return NextResponse.json(
        { error: "costId query parameter is required" },
        { status: 400 },
      );
    }

    await prisma.projectCost.delete({
      where: { id: costId, projectId },
    });

    await recalculateProjectCosts(projectId);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error deleting project cost:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete project cost" },
      { status: 500 },
    );
  }
}
