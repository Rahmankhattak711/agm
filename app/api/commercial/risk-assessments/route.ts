import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
import {
  getAllRiskAssessments,
  saveRiskAssessment,
} from "@/lib/risk-assessments-db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").toLowerCase().trim();
    const status = (searchParams.get("status") || "").toUpperCase().trim();

    let list = getAllRiskAssessments();

    if (status && status !== "ALL") {
      list = list.filter((a) => (a.status || "DRAFT").toUpperCase() === status);
    }

    if (search) {
      list = list.filter((a) => {
        return (
          a.refNumber?.toLowerCase().includes(search) ||
          a.customerName?.toLowerCase().includes(search) ||
          a.projectName?.toLowerCase().includes(search) ||
          a.projectLocation?.toLowerCase().includes(search)
        );
      });
    }

    return NextResponse.json(list);
  } catch (error: any) {
    console.error("GET /api/commercial/risk-assessments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch risk assessments", details: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    const body = await request.json();

    if (!body.refNumber) {
      return NextResponse.json(
        { error: "Reference number is required" },
        { status: 400 },
      );
    }

    const saved = saveRiskAssessment(body, authUser);
    return NextResponse.json(saved);
  } catch (error: any) {
    console.error("POST /api/commercial/risk-assessments error:", error);
    return NextResponse.json(
      { error: "Failed to save risk assessment", details: error.message },
      { status: 500 },
    );
  }
}
