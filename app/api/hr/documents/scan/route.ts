export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/auth-server";
import { scanDocumentWithOcr } from "@/lib/ocr/document-scanner";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Image data URL is required for scanning" },
        { status: 400 }
      );
    }

    // Convert data URL to Buffer if necessary
    let imageInput: string | Buffer = image;
    if (image.startsWith("data:image")) {
      const base64Data = image.split(",")[1];
      if (base64Data) {
        imageInput = Buffer.from(base64Data, "base64");
      }
    }

    const scanResult = await scanDocumentWithOcr(imageInput);

    return NextResponse.json(scanResult);
  } catch (error: any) {
    console.error("Document scan error:", error);
    return NextResponse.json(
      {
        success: false,
        isDocument: false,
        error: error.message || "Failed to scan document",
      },
      { status: 500 }
    );
  }
}
