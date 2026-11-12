// @ts-ignore
import mrz from "mrz";

export interface ParsedPassportData {
  documentType: "PASSPORT";
  documentNumber: string;
  expiryDate: string; // YYYY-MM-DD
  birthDate?: string; // YYYY-MM-DD
  fullName: string;
  firstName?: string;
  lastName?: string;
  nationality: string;
  issuingCountry: string;
  gender?: string;
  rawMrz?: string[];
  valid: boolean;
}

/**
 * Normalizes 2-digit year YY to 4-digit YYYY
 * For expiry dates: 00-70 -> 2000-2070
 * For birth dates: > 30 -> 1930-1999, <= 30 -> 2000-2030
 */
function normalizeDate(yy: string, mm: string, dd: string, isExpiry: boolean): string {
  const y = parseInt(yy, 10);
  const currentYearLast2 = new Date().getFullYear() % 100;
  let fullYear: number;

  if (isExpiry) {
    // Expiry dates are typically in the 2000s
    fullYear = 2000 + y;
  } else {
    // Birth dates
    fullYear = y > currentYearLast2 ? 1900 + y : 2000 + y;
  }

  const mmFormatted = mm.padStart(2, "0");
  const ddFormatted = dd.padStart(2, "0");
  return `${fullYear}-${mmFormatted}-${ddFormatted}`;
}

/**
 * Searches raw OCR text for ICAO 9303 MRZ lines (2 lines of 44 chars starting with P<)
 */
export function extractMrzFromText(ocrText: string): ParsedPassportData | null {
  if (!ocrText) return null;

  // Split into lines, trim and clean whitespace
  const rawLines = ocrText
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/\s+/g, "").toUpperCase())
    .filter((l) => l.length >= 30);

  // Look for lines containing '<' and length close to 44 (TD3 format standard passport)
  const candidateLines: string[] = [];
  for (const line of rawLines) {
    // Replace typical OCR confusions in MRZ
    const cleaned = line
      .replace(/«/g, "<")
      .replace(/\[/g, "<")
      .replace(/\{/g, "<")
      .replace(/\(/g, "<")
      .replace(/\|/g, "I");

    if (cleaned.includes("<") && cleaned.length >= 35) {
      candidateLines.push(cleaned);
    }
  }

  // Find line 1 (starts with P<) and line 2
  let line1Index = -1;
  for (let i = 0; i < candidateLines.length; i++) {
    if (candidateLines[i].startsWith("P<") || candidateLines[i].startsWith("P") && candidateLines[i][1] === "<") {
      line1Index = i;
      break;
    }
  }

  if (line1Index !== -1 && line1Index + 1 < candidateLines.length) {
    let l1 = candidateLines[line1Index].padEnd(44, "<").slice(0, 44);
    let l2 = candidateLines[line1Index + 1].padEnd(44, "<").slice(0, 44);

    try {
      const parsed = mrz.parse([l1, l2]);
      if (parsed && parsed.fields) {
        const f = parsed.fields;
        const docNum = (f.documentNumber || "").replace(/</g, "").trim();
        const expDate = f.expirationDate
          ? `${f.expirationDate.slice(0, 2)}-${f.expirationDate.slice(2, 4)}-${f.expirationDate.slice(4, 6)}`
          : "";

        let formattedExpiry = "";
        if (f.expirationDate && f.expirationDate.length === 6) {
          formattedExpiry = normalizeDate(
            f.expirationDate.slice(0, 2),
            f.expirationDate.slice(2, 4),
            f.expirationDate.slice(4, 6),
            true
          );
        }

        let formattedBirth = "";
        if (f.birthDate && f.birthDate.length === 6) {
          formattedBirth = normalizeDate(
            f.birthDate.slice(0, 2),
            f.birthDate.slice(2, 4),
            f.birthDate.slice(4, 6),
            false
          );
        }

        const fullName = [f.firstName, f.lastName].filter(Boolean).join(" ").trim() || f.lastName || "Passport Holder";

        return {
          documentType: "PASSPORT",
          documentNumber: docNum,
          expiryDate: formattedExpiry,
          birthDate: formattedBirth,
          fullName,
          firstName: f.firstName || "",
          lastName: f.lastName || "",
          nationality: f.nationality || "",
          issuingCountry: f.issuingState || "",
          gender: f.sex === "M" ? "MALE" : f.sex === "F" ? "FEMALE" : undefined,
          rawMrz: [l1, l2],
          valid: parsed.valid ?? true,
        };
      }
    } catch {
      // Fallback manual regex parser if mrz.parse fails checksum
      return parseMrzFallback(l1, l2);
    }
  }

  // Fallback regex search for standard passport numbers and expiry dates in text
  return parsePassportTextRegex(ocrText);
}

/**
 * Fallback parser for standard 2-line TD3 passport MRZ
 */
function parseMrzFallback(line1: string, line2: string): ParsedPassportData | null {
  try {
    // Line 1: P<ISSCountryName<<GivenNames<<<<
    const country = line1.slice(2, 5).replace(/</g, "");
    const namesPart = line1.slice(5).split("<<");
    const lastName = (namesPart[0] || "").replace(/</g, " ").trim();
    const firstName = (namesPart[1] || "").replace(/</g, " ").trim();
    const fullName = `${firstName} ${lastName}`.trim() || lastName;

    // Line 2: DocNum(9) Check(1) Nationality(3) DOB(6) Check(1) Sex(1) Expiry(6) Check(1)
    const docNum = line2.slice(0, 9).replace(/</g, "").trim();
    const nationality = line2.slice(10, 13).replace(/</g, "");
    const dobRaw = line2.slice(13, 19);
    const sexRaw = line2[20];
    const expRaw = line2.slice(21, 27);

    let expiryDate = "";
    if (/^\d{6}$/.test(expRaw)) {
      expiryDate = normalizeDate(expRaw.slice(0, 2), expRaw.slice(2, 4), expRaw.slice(4, 6), true);
    }

    let birthDate = "";
    if (/^\d{6}$/.test(dobRaw)) {
      birthDate = normalizeDate(dobRaw.slice(0, 2), dobRaw.slice(2, 4), dobRaw.slice(4, 6), false);
    }

    if (docNum.length >= 6) {
      return {
        documentType: "PASSPORT",
        documentNumber: docNum,
        expiryDate,
        birthDate,
        fullName,
        firstName,
        lastName,
        nationality: nationality || country,
        issuingCountry: country,
        gender: sexRaw === "M" ? "MALE" : sexRaw === "F" ? "FEMALE" : undefined,
        rawMrz: [line1, line2],
        valid: Boolean(docNum && expiryDate),
      };
    }
  } catch {
    // Ignore error
  }
  return null;
}

/**
 * Fallback regex search for passport text if MRZ was cut off
 */
function parsePassportTextRegex(text: string): ParsedPassportData | null {
  // Common passport number patterns (1-2 letters followed by 7-8 digits)
  const passRegex = /\b([A-Z]{1,2}\d{7,8})\b/i;
  const match = text.match(passRegex);

  // Expiry date pattern: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dateRegex = /\b(\d{2})[./-](\d{2})[./-](\d{4})\b/g;
  const dateMatches = [...text.matchAll(dateRegex)];

  if (match) {
    const docNumber = match[1].toUpperCase();
    let expiryDate = "";

    // If dates found, usually the later date is expiry
    if (dateMatches.length > 0) {
      const dates = dateMatches.map((m) => {
        const [_, d, mth, y] = m;
        return `${y}-${mth.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }).sort();

      // Later date is typically expiry
      expiryDate = dates[dates.length - 1];
    }

    return {
      documentType: "PASSPORT",
      documentNumber: docNumber,
      expiryDate,
      fullName: "",
      nationality: "",
      issuingCountry: "",
      valid: true,
    };
  }

  return null;
}
