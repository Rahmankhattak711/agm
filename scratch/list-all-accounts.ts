import { prisma } from "../lib/prisma";

async function main() {
  const accounts = await prisma.chartOfAccount.findMany({
    orderBy: { accountCode: "asc" },
    select: { id: true, accountCode: true, accountName: true, type: true, level: true, parentId: true, allowPosting: true }
  });
  console.log(`Total accounts: ${accounts.length}`);
  accounts.forEach(a => console.log(`${a.accountCode} | L${a.level} | ${a.type} | Posting: ${a.allowPosting} | ${a.accountName}`));
}

main().catch(console.error).finally(() => process.exit(0));
