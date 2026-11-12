export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { forbidden, getAuthUser, hasRole, unauthorized } from "@/lib/auth-server";
import { scanDocumentWithOcr } from "@/lib/ocr/document-scanner";
import { rateLimit } from "@/lib/auth/rate-limit";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_BASE64_LENGTH = 15 * 1024 * 1024; // 15MB

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    if (!hasRole(user, "HR")) {
      return forbidden(
        "Forbidden: Only HR and Admins can scan documents",
      );
    }

    const rateLimitResult = rateLimit(`ocr:${user.id}`, 10, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many OCR scanning requests. Please wait a minute before retrying.",
          retryAfterMs: rateLimitResult.resetMs,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Image data URL is required for scanning" },
        { status: 400 }
      );
    }

    if (image.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { error: "Payload too large: maximum allowed image size is 10MB" },
        { status: 413 }
      );
    }

    // Convert data URL to Buffer if necessary
    let imageInput: string | Buffer = image;
    if (image.startsWith("data:")) {
      const match = image.match(/^data:(image\/(?:jpeg|png|webp|tiff|bmp));base64,/i);
      if (!match) {
        return NextResponse.json(
          { error: "Invalid image format: must be a supported raster image (JPEG, PNG, WEBP)" },
          { status: 400 }
        );
      }
      const base64Data = image.slice(match[0].length);
      const buffer = Buffer.from(base64Data, "base64");
      if (buffer.length > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "Payload too large: maximum allowed image size is 10MB" },
          { status: 413 }
        );
      }
      imageInput = buffer;
    }

    const scanResult = await scanDocumentWithOcr(imageInput);

    return NextResponse.json(scanResult);
  } catch (error: any) {
    console.error("Document scan error:", error);
    return NextResponse.json(
      {
        success: false,
        isDocument: false,
        error: "Failed to scan document",
      },
      { status: 500 }
    );
  }
}
