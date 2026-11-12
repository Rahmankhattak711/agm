export const runtime = "nodejs";

import {
  forbidden,
  getAuthUser,
  isHRorAdmin,
  resolveLinkedEmployee,
  unauthorized,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const MAX_DECODED_BYTES = 8 * 1024 * 1024; // 8 MB binary limit
const MAX_BASE64_LENGTH = 11.5 * 1024 * 1024; // Base64 encoding overhead limit (~8 MB)

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;
  switch (mimeType) {
    case "application/pdf":
      // %PDF (0x25 0x50 0x44 0x46)
      return (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46
      );
    case "image/jpeg":
      // 0xFF 0xD8 0xFF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/png":
      // 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
      return (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    case "image/webp":
      // RIFF....WEBP
      return (
        buffer.length >= 12 &&
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
      );
    default:
      return false;
  }
}

function getSafeFilename(
  empCode: string,
  docType: string,
  firstName: string,
  lastName: string,
  mimeType: string,
): string {
  const extMap: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const ext = extMap[mimeType] || "bin";
  const rawName = `${empCode}_${docType}_${firstName}_${lastName}`;
  const safeName = rawName.replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_");
  return `${safeName}.${ext}`;
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    if (!isHRorAdmin(user) && user.role !== "USER") {
      return forbidden(
        "Forbidden: You do not have permission to download employee compliance documents",
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 },
      );
    }

    const doc = await prisma.employeeDocument.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        documentType: true,
        fileName: true,
        fileUrl: true,
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!doc || !doc.fileUrl) {
      return NextResponse.json(
        { error: "Document file attachment not found" },
        { status: 404 },
      );
    }

    // Standard employee: ownership check against linked employee ID
    if (user.role === "USER") {
      const linkage = await resolveLinkedEmployee(user);
      if (linkage.status !== "MATCH" || linkage.employeeId !== doc.employeeId) {
        return forbidden(
          "Forbidden: You can only download your own compliance documents",
        );
      }
    }

    // Pre-decode Base64 length validation
    if (doc.fileUrl.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { error: "Document file exceeds the maximum 8MB limit" },
        { status: 413 },
      );
    }

    // Strict Data URL format validation
    const match = doc.fileUrl.match(
      /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-\+\.]+);base64,([A-Za-z0-9+/=]+)$/,
    );
    if (!match) {
      return NextResponse.json(
        { error: "Stored document format is invalid or corrupted" },
        { status: 422 },
      );
    }

    const mimeType = match[1].toLowerCase();
    const base64Data = match[2];

    if (base64Data.length % 4 !== 0) {
      return NextResponse.json(
        { error: "Stored document contains non-canonical Base64 padding" },
        { status: 422 },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported media type: ${mimeType}` },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.byteLength > MAX_DECODED_BYTES) {
      return NextResponse.json(
        { error: "Decoded file exceeds the maximum 8MB limit" },
        { status: 413 },
      );
    }

    if (!verifyMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { error: "File signature does not match declared MIME type" },
        { status: 415 },
      );
    }

    const safeFilename = getSafeFilename(
      doc.employee?.employeeCode || "EMP",
      doc.documentType || "DOCUMENT",
      doc.employee?.firstName || "Staff",
      doc.employee?.lastName || "",
      mimeType,
    );

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Content-Length": buffer.byteLength.toString(),
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Document download error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
