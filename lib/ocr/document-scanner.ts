import { createWorker } from "tesseract.js";
import { extractMrzFromText, ParsedPassportData } from "./passport-mrz";
import { extractEmiratesIdFromText, ParsedEmiratesIdData } from "./emirates-id";

export interface ScanDocumentResult {
  success: boolean;
  isDocument: boolean;
  documentType: "PASSPORT" | "EMIRATES_ID" | "RESIDENCE_VISA" | "OTHER";
  documentNumber: string;
  expiryDate: string;
  issueDate?: string;
  fullName?: string;
  nationality?: string;
  notes?: string;
  confidence: number;
  rawText?: string;
}

/**
 * Scans an image file (Buffer, base64 data URL, or file path) using local Tesseract WebAssembly engine
 */
export async function scanDocumentWithOcr(
  imageInput: string | Buffer
): Promise<ScanDocumentResult> {
  let worker: any = null;

  try {
    worker = await createWorker("eng");
    const ret = await worker.recognize(imageInput);
    const ocrText = ret?.data?.text || "";
    const confidence = ret?.data?.confidence || 0;

    await worker.terminate();
    worker = null;

    // 1. Try Passport MRZ extraction first (highest standard)
    const passportData: ParsedPassportData | null = extractMrzFromText(ocrText);
    if (passportData && passportData.documentNumber) {
      return {
        success: true,
        isDocument: true,
        documentType: "PASSPORT",
        documentNumber: passportData.documentNumber,
        expiryDate: passportData.expiryDate,
        issueDate: passportData.birthDate,
        fullName: passportData.fullName,
        nationality: passportData.nationality,
        notes: passportData.nationality
          ? `Nationality: ${passportData.nationality}${passportData.fullName ? ` · Name: ${passportData.fullName}` : ""}`
          : undefined,
        confidence: Math.round(confidence),
        rawText: ocrText.slice(0, 500),
      };
    }

    // 2. Try UAE Emirates ID / Visa pattern extraction
    const eidData: ParsedEmiratesIdData | null = extractEmiratesIdFromText(ocrText);
    if (eidData && (eidData.documentNumber || eidData.expiryDate)) {
      return {
        success: true,
        isDocument: true,
        documentType: eidData.documentType,
        documentNumber: eidData.documentNumber,
        expiryDate: eidData.expiryDate,
        issueDate: eidData.issueDate,
        fullName: eidData.fullName,
        notes: eidData.documentType === "EMIRATES_ID" ? "UAE Federal Identity Document" : "UAE Residence Visa",
        confidence: Math.round(confidence),
        rawText: ocrText.slice(0, 500),
      };
    }

    // 3. Fallback: Generic document text extracted
    const isDocLikely =
      ocrText.toLowerCase().includes("passport") ||
      ocrText.toLowerCase().includes("emirates") ||
      ocrText.toLowerCase().includes("identity") ||
      ocrText.toLowerCase().includes("visa") ||
      ocrText.toLowerCase().includes("expiry");

    return {
      success: true,
      isDocument: isDocLikely,
      documentType: "OTHER",
      documentNumber: "",
      expiryDate: "",
      confidence: Math.round(confidence),
      rawText: ocrText.slice(0, 500),
    };
  } catch (err: any) {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // ignore
      }
    }
    console.error("OCR scanning error:", err);
    return {
      success: false,
      isDocument: false,
      documentType: "OTHER",
      documentNumber: "",
      expiryDate: "",
      confidence: 0,
    };
  }
}
