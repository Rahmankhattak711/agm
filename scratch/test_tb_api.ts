import prisma from '../lib/prisma';

async function testTb() {
  const fromDate = new Date('2026-07-01T00:00:00.000Z');
  const toDate = new Date('2026-10-31T23:59:59.999Z');

  const accounts = await prisma.chartOfAccount.findMany({
    orderBy: { accountCode: 'asc' },
    include: {
      journalLines: {
        where: {
          journalEntry: { isPosted: true }
        },
        include: {
          journalEntry: {
            select: { entryDate: true }
          }
        }
      }
    }
  });

  console.log(`Fetched ${accounts.length} accounts.`);

  // Calculate per account
  const accountStats = new Map();
  for (const acc of accounts) {
    let openingDr = 0, openingCr = 0;
    let movDr = 0, movCr = 0;

    for (const line of acc.journalLines) {
      const d = line.journalEntry.entryDate;
      const dr = Number(line.debit || 0);
      const cr = Number(line.credit || 0);

      if (d < fromDate) {
        openingDr += dr;
        openingCr += cr;
      } else if (d <= toDate) {
        movDr += dr;
        movCr += cr;
      }
    }

    const net = (openingDr - openingCr) + (movDr - movCr);
    const closingDr = net > 0 ? net : 0;
    const closingCr = net < 0 ? Math.abs(net) : 0;

    accountStats.set(acc.id, {
      id: acc.id,
      code: acc.accountCode,
      name: acc.accountName,
      type: acc.type,
      subtype: acc.accountSubtype || (acc.type === 'ASSET' ? 'Current Assets' : acc.type === 'LIABILITY' ? 'Current Liabilities' : acc.type === 'REVENUE' ? 'Income' : acc.type === 'EXPENSE' ? 'Operating Expenses' : 'Equity'),
      level: acc.level,
      parentId: acc.parentId,
      openingDebit: openingDr,
      openingCredit: openingCr,
      movementDebit: movDr,
      movementCredit: movCr,
      closingDebit: closingDr,
      closingCredit: closingCr,
      hasDirectActivity: (openingDr > 0 || openingCr > 0 || movDr > 0 || movCr > 0)
    });
  }

  // Active accounts
  const activeIds = new Set<string>();
  for (const [id, stat] of accountStats) {
    if (stat.hasDirectActivity) {
      activeIds.add(id);
      // add parents
      let pid = stat.parentId;
      while (pid) {
        activeIds.add(pid);
        pid = accountStats.get(pid)?.parentId;
      }
    }
  }

  console.log(`Active + Ancestor accounts: ${activeIds.size}`);
  const relevantRows = accounts
    .filter(a => activeIds.has(a.id))
    .map(a => accountStats.get(a.id));

  // Grand totals of posting accounts
  let grandMovDr = 0, grandMovCr = 0;
  let grandCloseDr = 0, grandCloseCr = 0;
  for (const [id, s] of accountStats) {
    if (s.hasDirectActivity) {
      grandMovDr += s.movementDebit;
      grandMovCr += s.movementCredit;
      grandCloseDr += s.closingDebit;
      grandCloseCr += s.closingCredit;
    }
  }

  console.log(`Movements Total: Dr ${grandMovDr.toFixed(2)} | Cr ${grandMovCr.toFixed(2)} (Diff: ${(grandMovDr - grandMovCr).toFixed(2)})`);
  console.log(`Closing Total:   Dr ${grandCloseDr.toFixed(2)} | Cr ${grandCloseCr.toFixed(2)} (Diff: ${(grandCloseDr - grandCloseCr).toFixed(2)})`);

  for (const r of relevantRows) {
    console.log(`[${r.code}] ${r.name.padEnd(30)} | Parent: ${r.parentId ? 'YES' : 'ROOT'} | MovDr: ${r.movementDebit.toFixed(2)} | MovCr: ${r.movementCredit.toFixed(2)} | CloseDr: ${r.closingDebit.toFixed(2)} | CloseCr: ${r.closingCredit.toFixed(2)}`);
  }
}

testTb().catch(console.error).finally(() => prisma.$disconnect());
