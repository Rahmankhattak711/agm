export interface ParsedEmiratesIdData {
  documentType: "EMIRATES_ID" | "RESIDENCE_VISA";
  documentNumber: string; // 784-YYYY-XXXXXXX-X
  expiryDate: string; // YYYY-MM-DD
  issueDate?: string;
  fullName?: string;
  nationality?: string;
  cardNumber?: string;
  valid: boolean;
}

/**
 * Searches raw OCR text for UAE Emirates ID patterns (784-YYYY-XXXXXXX-X) and Expiry Dates
 */
export function extractEmiratesIdFromText(text: string): ParsedEmiratesIdData | null {
  if (!text) return null;

  // Pattern 1: Standard formatted 784-1990-1234567-1
  const eidFormattedRegex = /\b(784)[- ]?(\d{4})[- ]?(\d{7})[- ]?(\d)\b/;
  const match = text.match(eidFormattedRegex);

  // Expiry date regex: matches patterns like 2026/11/15, 15/11/2026, 15-11-2026, etc.
  const dateRegex = /\b(\d{2})[./-](\d{2})[./-](\d{4})\b|\b(\d{4})[./-](\d{2})[./-](\d{2})\b/g;
  const dateMatches = [...text.matchAll(dateRegex)];

  // Look for keywords like "Expiry Date", "Exp:", "Expiry", "تاريخ الانتهاء"
  let expiryDate = "";
  let issueDate = "";

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("exp") || lower.includes("انتهاء")) {
      const lineDateMatch = line.match(/(\d{2})[./-](\d{2})[./-](\d{4})|(\d{4})[./-](\d{2})[./-](\d{2})/);
      if (lineDateMatch) {
        expiryDate = formatMatchToIsoDate(lineDateMatch[0]);
      }
    } else if (lower.includes("issue") || lower.includes("اصدار") || lower.includes("issuing")) {
      const lineDateMatch = line.match(/(\d{2})[./-](\d{2})[./-](\d{4})|(\d{4})[./-](\d{2})[./-](\d{2})/);
      if (lineDateMatch) {
        issueDate = formatMatchToIsoDate(lineDateMatch[0]);
      }
    }
  }

  // If no specific line matched, sort all found dates (latest date is usually expiry)
  if (!expiryDate && dateMatches.length > 0) {
    const formattedDates = dateMatches
      .map((m) => formatMatchToIsoDate(m[0]))
      .filter(Boolean)
      .sort();

    if (formattedDates.length > 0) {
      expiryDate = formattedDates[formattedDates.length - 1];
      if (formattedDates.length > 1) {
        issueDate = formattedDates[0];
      }
    }
  }

  if (match) {
    const [_, p1, p2, p3, p4] = match;
    const standardEid = `${p1}-${p2}-${p3}-${p4}`;

    return {
      documentType: "EMIRATES_ID",
      documentNumber: standardEid,
      expiryDate,
      issueDate,
      valid: true,
    };
  }

  // Check if it's a UAE Residence Visa (e.g. File No 201/2024/...)
  const visaFileRegex = /\b(20[12]\/\d{4}\/\d{6,8})\b/;
  const visaMatch = text.match(visaFileRegex);
  if (visaMatch || text.includes("RESIDENCE") || text.includes("اقامة")) {
    const visaNumber = visaMatch ? visaMatch[1] : "";
    if (visaNumber || expiryDate) {
      return {
        documentType: "RESIDENCE_VISA",
        documentNumber: visaNumber,
        expiryDate,
        issueDate,
        valid: true,
      };
    }
  }

  return null;
}

function formatMatchToIsoDate(raw: string): string {
  if (!raw) return "";
  const parts = raw.split(/[./-]/);
  if (parts.length !== 3) return "";

  if (parts[0].length === 4) {
    // YYYY-MM-DD
    return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
  } else if (parts[2].length === 4) {
    // DD-MM-YYYY
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return "";
}
