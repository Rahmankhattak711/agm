const fs = require('fs');

// Fix app/api/accounts/route.ts
let accountsRoute = fs.readFileSync('app/api/accounts/route.ts', 'utf8');
accountsRoute = accountsRoute.replace(
  'function getRollupBalance(id) {',
  'function getRollupBalance(id: string): number {'
);
fs.writeFileSync('app/api/accounts/route.ts', accountsRoute, 'utf8');

// Fix prisma/seed-wafeq-coa.ts
let seedCoa = fs.readFileSync('prisma/seed-wafeq-coa.ts', 'utf8');
seedCoa = seedCoa.replace(
  "import { AccountType } from '@prisma/client';",
  "type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';"
);
fs.writeFileSync('prisma/seed-wafeq-coa.ts', seedCoa, 'utf8');

console.log('Fixed types!');
