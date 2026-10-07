const { PrismaClient } = require("../app/generated/prisma");

const prisma = new PrismaClient();
const round2 = (n) => Math.round(n * 100) / 100;

async function main() {
  const invoices = await prisma.salesInvoice.findMany({
    where: { status: "DRAFT" },
    include: { items: true },
  });

  for (const inv of invoices) {
    const subtotal = round2(
      inv.items.reduce((s, i) => s + Number(i.totalAmount || 0), 0) ||
        Number(inv.subtotal || 0),
    );
    const discount = round2(Number(inv.discount || 0));
    const vatRate = Number(inv.vatRate || 5);
    const vatAmount = round2(((subtotal - discount) * vatRate) / 100);
    const totalAmount = round2(subtotal - discount + vatAmount);
    const paid = Number(inv.paidAmount || 0);

    await prisma.salesInvoice.update({
      where: { id: inv.id },
      data: {
        subtotal,
        vatAmount,
        totalAmount,
        remainingBalance: round2(totalAmount - paid),
      },
    });
    console.log(
      `${inv.invoiceNumber}: subtotal ${subtotal}, VAT ${vatAmount}, total ${totalAmount}`,
    );

    if (inv.quotationRef) {
      const projects = await prisma.project.findMany({
        where: { name: { contains: inv.quotationRef } },
      });
      for (const p of projects) {
        await prisma.project.update({
          where: { id: p.id },
          data: { contractValue: totalAmount, budget: totalAmount },
        });
        console.log(`  ${p.projectCode}: contract & budget -> ${totalAmount}`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
