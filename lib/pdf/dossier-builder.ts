import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface DossierEmployeeInfo {
  employeeCode: string;
  fullName: string;
  department: string;
  designation: string;
  joiningDate?: string;
  email?: string;
  phone?: string;
  employmentStatus?: string;
}

export interface DossierDocumentItem {
  id: string;
  documentType: string;
  documentNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  status: string;
  fileName: string | null;
  fileUrl: string | null;
  notes?: string | null;
}

/**
 * Builds a multi-page professional PDF dossier:
 * Page 1: Official AGM Fitout Cover Sheet & Compliance Credentials Summary Table
 * Page 2+: High-Resolution Document Attachments (Passport, Emirates ID, Visa copies)
 */
export async function buildEmployeeDossierPdf(
  employee: DossierEmployeeInfo,
  documents: DossierDocumentItem[]
): Promise<Uint8Array> {
  // =========================================================================
  // STEP 1: Generate Cover Sheet using jsPDF
  // =========================================================================
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor: [number, number, number] = [24, 75, 47]; // AGM Green #184b2f
  const charcoalColor: [number, number, number] = [30, 41, 59]; // Slate 800

  // 1. Header Bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("AGM FITOUT LLC · DUBAI, UAE", 14, 11);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Corporate Human Resources & PRO Compliance Center", 14, 18);

  const todayStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  doc.text(`Generated: ${todayStr}`, 196, 18, { align: "right" });

  // 2. Dossier Title
  doc.setTextColor(...charcoalColor);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("EMPLOYEE COMPLIANCE & LEGAL CREDENTIALS DOSSIER", 14, 36);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Official verification bundle compiled for Ministry of Human Resources, GDRFA, and Enterprise Audit.",
    14,
    42
  );

  // 3. Employee Master Information Card
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 46, 182, 34, 3, 3, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("STAFF IDENTITY & EMPLOYMENT PROFILE", 19, 52);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);

  // Column 1
  doc.text(`Full Name: `, 19, 60);
  doc.setFont("helvetica", "bold");
  doc.text(`${employee.fullName}`, 40, 60);
  doc.setFont("helvetica", "normal");

  doc.text(`Employee Code: `, 19, 66);
  doc.setFont("helvetica", "bold");
  doc.text(`${employee.employeeCode}`, 44, 66);
  doc.setFont("helvetica", "normal");

  doc.text(`Joining Date: `, 19, 72);
  doc.text(`${employee.joiningDate || "N/A"}`, 40, 72);

  // Column 2
  doc.text(`Department: `, 90, 60);
  doc.setFont("helvetica", "bold");
  doc.text(`${employee.department || "Operations"}`, 112, 60);
  doc.setFont("helvetica", "normal");

  doc.text(`Designation: `, 90, 66);
  doc.setFont("helvetica", "bold");
  doc.text(`${employee.designation || "Staff"}`, 112, 66);
  doc.setFont("helvetica", "normal");

  doc.text(`Status: `, 90, 72);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 101, 52);
  doc.text(`${employee.employmentStatus || "ACTIVE"}`, 104, 72);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");

  // Column 3
  doc.text(`Email: `, 145, 60);
  doc.text(`${employee.email || "—"}`, 157, 60);

  doc.text(`Phone: `, 145, 66);
  doc.text(`${employee.phone || "—"}`, 158, 66);

  // 4. Table of Attached Compliance Documents
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...charcoalColor);
  doc.text("VERIFIED LEGAL CREDENTIALS SUMMARY", 14, 90);

  const tableBody = documents.map((d, index) => [
    (index + 1).toString(),
    d.documentType.replace(/_/g, " "),
    d.documentNumber || "Not Registered",
    d.issueDate || "—",
    d.expiryDate || "No Expiry",
    d.status || "VALID",
    d.fileName ? "Attached" : "Record Only",
  ]);

  autoTable(doc, {
    startY: 94,
    head: [["#", "DOCUMENT TYPE", "DOCUMENT NUMBER", "ISSUE DATE", "EXPIRY DATE", "STATUS", "ATTACHMENT"]],
    body: tableBody,
    theme: "grid",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 38 },
      2: { cellWidth: 42 },
      3: { cellWidth: 24 },
      4: { cellWidth: 24 },
      5: { cellWidth: 24 },
      6: { cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
  });

  // 5. Verification Footer
  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "CONFIDENTIAL & PROPRIETARY · AGM FITOUT TECHNICAL SERVICES LLC · ALL RIGHTS RESERVED",
    14,
    285
  );
  doc.text("Page 1 of Dossier", 196, 285, { align: "right" });

  const coverSheetArrayBuffer = doc.output("arraybuffer");

  // =========================================================================
  // STEP 2: Merge Document Attachments using pdf-lib
  // =========================================================================
  const finalPdf = await PDFDocument.create();

  // Load and copy cover sheet page into final document
  const coverPdfDoc = await PDFDocument.load(coverSheetArrayBuffer);
  const [coverPage] = await finalPdf.copyPages(coverPdfDoc, [0]);
  finalPdf.addPage(coverPage);

  // Embed each selected document with an attachment
  for (let i = 0; i < documents.length; i++) {
    const d = documents[i];
    if (!d.fileUrl) continue;

    try {
      if (d.fileUrl.startsWith("data:application/pdf") || d.fileUrl.startsWith("%PDF")) {
        // Merge PDF attachment
        const base64Data = d.fileUrl.replace(/^data:application\/pdf;base64,/, "");
        const binaryPdf = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const subDoc = await PDFDocument.load(binaryPdf);
        const copiedPages = await finalPdf.copyPages(subDoc, subDoc.getPageIndices());
        copiedPages.forEach((p) => finalPdf.addPage(p));
      } else if (
        d.fileUrl.startsWith("data:image/") ||
        d.fileUrl.startsWith("http") ||
        d.fileUrl.startsWith("/")
      ) {
        // Embed Image attachment
        const page = finalPdf.addPage([595.28, 841.89]); // A4 Size in points
        const helveticaBold = await finalPdf.embedFont(StandardFonts.HelveticaBold);
        const helvetica = await finalPdf.embedFont(StandardFonts.Helvetica);

        // Header strip on attachment page
        page.drawRectangle({
          x: 0,
          y: 810,
          width: 595.28,
          height: 32,
          color: rgb(0.09, 0.29, 0.18), // AGM Green
        });

        page.drawText(`DOCUMENT ATTACHMENT ${i + 1}: ${d.documentType.replace(/_/g, " ")}`, {
          x: 25,
          y: 822,
          size: 11,
          font: helveticaBold,
          color: rgb(1, 1, 1),
        });

        page.drawText(`${employee.fullName} (${employee.employeeCode}) · Doc #${d.documentNumber || "N/A"}`, {
          x: 350,
          y: 822,
          size: 9,
          font: helvetica,
          color: rgb(0.85, 0.95, 0.88),
        });

        // Embed the image
        let imageBytes: Uint8Array;
        if (d.fileUrl.startsWith("data:image/")) {
          const base64Data = d.fileUrl.split(",")[1];
          imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        } else {
          // If relative or absolute URL, fetch
          const res = await fetch(d.fileUrl);
          const buf = await res.arrayBuffer();
          imageBytes = new Uint8Array(buf);
        }

        let embeddedImage;
        if (d.fileUrl.includes("png")) {
          embeddedImage = await finalPdf.embedPng(imageBytes);
        } else {
          embeddedImage = await finalPdf.embedJpg(imageBytes);
        }

        // Scale image to fit within printable area (A4 margins)
        const maxWidth = 540;
        const maxHeight = 740;
        const imgDims = embeddedImage.scaleToFit(maxWidth, maxHeight);

        const imgX = (595.28 - imgDims.width) / 2;
        const imgY = (790 - imgDims.height) / 2 + 10;

        page.drawImage(embeddedImage, {
          x: imgX,
          y: imgY,
          width: imgDims.width,
          height: imgDims.height,
        });

        // Footer
        page.drawText(`Page ${finalPdf.getPageCount()} of Dossier · Official Record`, {
          x: 25,
          y: 15,
          size: 8,
          font: helvetica,
          color: rgb(0.58, 0.64, 0.72),
        });
      }
    } catch (err) {
      console.warn(`Could not embed attachment for document ${d.id}:`, err);
    }
  }

  return await finalPdf.save();
}
