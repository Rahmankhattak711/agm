import prisma from "../lib/prisma";

async function main() {
  console.log("=== TRIAL BALANCE VERIFICATION ===");
  
  const postedLines = await prisma.journalEntryLine.findMany({
    where: { journalEntry: { isPosted: true } },
    include: { account: true, journalEntry: true }
  });
  
  console.log(`Total Posted Journal Lines: ${postedLines.length}`);
  
  let totalDebit = 0;
  let totalCredit = 0;
  const acctMap = new Map<string, { code: string; name: string; type: string; debit: number; credit: number }>();
  
  for (const l of postedLines) {
    const d = Number(l.debit || 0);
    const c = Number(l.credit || 0);
    totalDebit += d;
    totalCredit += c;
    
    const cur = acctMap.get(l.accountId) || {
      code: l.account.accountCode,
      name: l.account.accountName,
      type: l.account.type,
      debit: 0,
      credit: 0
    };
    cur.debit += d;
    cur.credit += c;
    acctMap.set(l.accountId, cur);
  }
  
  console.log(`Gross Double-Entry Totals:`);
  console.log(`  Total Debit:  AED ${totalDebit.toFixed(2)}`);
  console.log(`  Total Credit: AED ${totalCredit.toFixed(2)}`);
  console.log(`  Difference:   AED ${Math.abs(totalDebit - totalCredit).toFixed(2)}`);
  
  let netDebitTotal = 0;
  let netCreditTotal = 0;
  
  console.log("\nAccount Net Balances:");
  for (const [id, acc] of acctMap) {
    const net = acc.debit - acc.credit;
    const closingDr = net > 0 ? net : 0;
    const closingCr = net < 0 ? Math.abs(net) : 0;
    netDebitTotal += closingDr;
    netCreditTotal += closingCr;
    console.log(`  [${acc.code}] ${acc.name.padEnd(35)} | Type: ${acc.type.padEnd(8)} | Dr: ${closingDr.toFixed(2).padStart(10)} | Cr: ${closingCr.toFixed(2).padStart(10)}`);
  }
  
  console.log(`\nClosing Trial Balance Totals:`);
  console.log(`  Debit:      AED ${netDebitTotal.toFixed(2)}`);
  console.log(`  Credit:     AED ${netCreditTotal.toFixed(2)}`);
  console.log(`  Difference: AED ${Math.abs(netDebitTotal - netCreditTotal).toFixed(2)}`);
  console.log(`  Balanced:   ${Math.abs(netDebitTotal - netCreditTotal) < 0.01 ? "YES (True Double-Entry)" : "NO"}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
