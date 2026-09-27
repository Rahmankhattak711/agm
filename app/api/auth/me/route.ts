import { getAuthUser, unauthorized } from "@/lib/auth-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return unauthorized();
    }
    return NextResponse.json({ user: authUser });
  } catch (error: any) {
    return unauthorized();
  }
}
