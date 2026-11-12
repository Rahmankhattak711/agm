import { getAuthUser, forbidden } from "@/lib/auth-server";
import { WorkerService } from "@/lib/modules/hr/services/worker.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;

    const workers = await WorkerService.getOperationalWorkers({ category, search });

    return NextResponse.json({
      workers,
      totalWorkers: workers.length,
    });
  } catch (error) {
    console.error("Error fetching workers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
