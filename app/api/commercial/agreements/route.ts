import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
import { getAllAgreements, saveAgreement } from "@/lib/agreements-db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").toLowerCase().trim();
    const status = (searchParams.get("status") || "").toUpperCase().trim();

    let list = getAllAgreements();

    if (status && status !== "ALL") {
      list = list.filter((a) => (a.status || "DRAFT").toUpperCase() === status);
    }

    if (search) {
      list = list.filter((a) => {
        return (
          a.refNumber?.toLowerCase().includes(search) ||
          a.client?.name?.toLowerCase().includes(search) ||
          a.project?.toLowerCase().includes(search) ||
          a.property?.toLowerCase().includes(search) ||
          a.contractor?.name?.toLowerCase().includes(search)
        );
      });
    }

    return NextResponse.json(list);
  } catch (error: any) {
    console.error("GET /api/commercial/agreements error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agreements", details: error.message },
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
        { error: "Agreement reference number is required" },
        { status: 400 },
      );
    }

    const saved = saveAgreement(body, authUser);
    return NextResponse.json(saved);
  } catch (error: any) {
    console.error("POST /api/commercial/agreements error:", error);
    return NextResponse.json(
      { error: "Failed to save agreement", details: error.message },
      { status: 500 },
    );
  }
}
