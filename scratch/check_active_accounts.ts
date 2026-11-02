import prisma from '../lib/prisma';

async function main() {
  const accounts = await prisma.chartOfAccount.findMany({
    orderBy: { accountCode: 'asc' },
    include: {
      journalLines: {
        where: { journalEntry: { isPosted: true } }
      }
    }
  });
  console.log('Total Accounts:', accounts.length);
  const active = accounts.filter(a => a.journalLines.length > 0);
  console.log('Active Accounts count:', active.length);
  for (const a of active) {
    let d = 0, c = 0;
    for (const l of a.journalLines) {
      d += Number(l.debit || 0);
      c += Number(l.credit || 0);
    }
    console.log(`[${a.accountCode}] ${a.accountName} (lvl ${a.level}, parent: ${a.parentId}) -> Dr: ${d}, Cr: ${c}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
