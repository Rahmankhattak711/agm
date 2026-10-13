export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Public signup is disabled. User accounts must be created by an authorized Super Admin.",
    },
    { status: 403 },
  );
}
