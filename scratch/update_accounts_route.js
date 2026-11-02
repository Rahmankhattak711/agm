const fs = require('fs');
const filePath = 'app/api/accounts/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

const target = '    return NextResponse.json(enrichedAccounts);';
const replacement = `    // Rollup balances for parent / group accounts (Level 1, 2, 3)
    const accountMap = new Map();
    enrichedAccounts.forEach((acc) => {
      accountMap.set(acc.id, { id: acc.id, balance: acc.balance, childrenIds: [] });
    });

    enrichedAccounts.forEach((acc) => {
      if (acc.parentId && accountMap.has(acc.parentId)) {
        accountMap.get(acc.parentId).childrenIds.push(acc.id);
      }
    });

    function getRollupBalance(id) {
      const item = accountMap.get(id);
      if (!item) return 0;
      if (!item.childrenIds || item.childrenIds.length === 0) {
        return item.balance;
      }
      let sum = item.balance;
      for (const childId of item.childrenIds) {
        sum += getRollupBalance(childId);
      }
      return sum;
    }

    const finalAccounts = enrichedAccounts.map((acc) => {
      const item = accountMap.get(acc.id);
      if (item && item.childrenIds && item.childrenIds.length > 0) {
        return {
          ...acc,
          balance: getRollupBalance(acc.id),
        };
      }
      return acc;
    });

    return NextResponse.json(finalAccounts);`;

if (!content.includes(target)) {
  console.error('Target not found!');
  process.exit(1);
}

content = content.replace(target, replacement);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated app/api/accounts/route.ts with rollup balances!');
