const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const accounts = await prisma.chartOfAccount.findMany({
    select: { id: true, accountCode: true, accountName: true, type: true, level: true, parentId: true, isSystem: true, allowPosting: true }
  });
  console.log('Total accounts in DB:', accounts.length);
  console.log(JSON.stringify(accounts, null, 2));
  
  const jlCount = await prisma.journalEntryLine.count();
  console.log('Total journal lines:', jlCount);

  if (jlCount > 0) {
    const lines = await prisma.journalEntryLine.findMany({
      select: { id: true, accountId: true, account: { select: { accountCode: true } } },
      take: 10
    });
    console.log('Sample journal lines:', JSON.stringify(lines, null, 2));
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
