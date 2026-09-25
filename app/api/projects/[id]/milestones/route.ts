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

    const { id: projectId } = await params;

    const milestones = await prisma.projectMilestone.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(milestones);
  } catch (error: any) {
    console.error("Error fetching project milestones:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch milestones" },
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

    const {
      title,
      description,
      order,
      status = "NOT_STARTED",
      progressPct = 0,
      dueDate,
      completionDate,
      billedAmount,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId,
        title: title.trim(),
        description: description?.trim() || null,
        order: order !== undefined ? Number(order) : 1,
        status,
        progressPct: Number(progressPct) || 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        completionDate: completionDate ? new Date(completionDate) : null,
        billedAmount: billedAmount !== undefined ? Number(billedAmount) : null,
      },
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error: any) {
    console.error("Error creating project milestone:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create milestone" },
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
    const milestoneId = searchParams.get("milestoneId");

    if (!milestoneId) {
      return NextResponse.json(
        { error: "milestoneId is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined)
      updateData.description = body.description?.trim() || null;
    if (body.order !== undefined) updateData.order = Number(body.order);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.progressPct !== undefined)
      updateData.progressPct = Number(body.progressPct);
    if (body.dueDate !== undefined)
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.completionDate !== undefined)
      updateData.completionDate = body.completionDate
        ? new Date(body.completionDate)
        : null;
    if (body.billedAmount !== undefined)
      updateData.billedAmount =
        body.billedAmount !== null ? Number(body.billedAmount) : null;

    const updated = await prisma.projectMilestone.update({
      where: { id: milestoneId, projectId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating milestone:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update milestone" },
      { status: 500 },
    );
  }
}
