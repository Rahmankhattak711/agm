import { NextResponse } from "next/server";
import {
  getRiskAssessmentById,
  deleteRiskAssessment,
} from "@/lib/risk-assessments-db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const item = getRiskAssessmentById(id);
    if (!item) {
      return NextResponse.json(
        { error: "Risk assessment not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to get risk assessment", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ok = deleteRiskAssessment(id);
    if (!ok) {
      return NextResponse.json(
        { error: "Risk assessment not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete risk assessment", details: error.message },
      { status: 500 },
    );
  }
}
