import prisma from "@/lib/prisma";

export async function getNextInvoiceNumber(tx: any = prisma): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const existing = await tx.salesInvoice.findMany({
    where: { invoiceNumber: { startsWith: prefix } },
    select: { invoiceNumber: true },
  });

  let maxNum = 0;
  for (const item of existing) {
    const numPart = item.invoiceNumber.slice(prefix.length);
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed) && parsed > maxNum) {
      maxNum = parsed;
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `${prefix}${nextNum.toString().padStart(4, "0")}`;
  while (
    await tx.salesInvoice.findUnique({ where: { invoiceNumber: candidate } })
  ) {
    nextNum++;
    candidate = `${prefix}${nextNum.toString().padStart(4, "0")}`;
  }

  return candidate;
}

export async function getNextProjectCode(tx: any = prisma): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PRJ-${year}-`;
  const existing = await tx.project.findMany({
    where: { projectCode: { startsWith: prefix } },
    select: { projectCode: true },
  });

  let maxNum = 0;
  for (const item of existing) {
    const numPart = item.projectCode.slice(prefix.length);
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed) && parsed > maxNum) {
      maxNum = parsed;
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `${prefix}${nextNum.toString().padStart(4, "0")}`;
  while (await tx.project.findUnique({ where: { projectCode: candidate } })) {
    nextNum++;
    candidate = `${prefix}${nextNum.toString().padStart(4, "0")}`;
  }

  return candidate;
}
