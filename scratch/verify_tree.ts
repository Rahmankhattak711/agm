import { prisma } from '../lib/prisma';

async function test() {
  const rootAccounts = await prisma.chartOfAccount.findMany({
    where: { level: 1 },
    include: {
      children: {
        where: { level: 2 },
        include: {
          children: {
            where: { level: 3 },
            include: {
              children: {
                where: { level: 4 },
              },
            },
          },
        },
      },
    },
    orderBy: { accountCode: 'asc' },
  });

  console.log(`=== Chart of Accounts Tree Hierarchy in PostgreSQL ===`);
  console.log(`Total Level 1 Categories: ${rootAccounts.length}`);
  
  rootAccounts.forEach((r) => {
    console.log(`[Level 1] ${r.accountCode} - ${r.accountName} (${r.type}) -> ${r.children.length} Groups`);
    r.children.forEach((c2) => {
      console.log(`   [Level 2] ${c2.accountCode} - ${c2.accountName} -> ${c2.children.length} Sub-groups`);
      c2.children.forEach((c3) => {
        console.log(`      [Level 3] ${c3.accountCode} - ${c3.accountName} -> ${c3.children.length} Accounts`);
        c3.children.forEach((c4) => {
          console.log(`         [Level 4] ${c4.accountCode} - ${c4.accountName}`);
        });
      });
    });
  });
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
