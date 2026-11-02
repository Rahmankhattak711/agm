const fs = require('fs');
let code = fs.readFileSync('app/api/accounts/route.ts', 'utf8');

code = code.replace(
  /import\s*\{[\s\S]*?\}\s*from\s*["']@\/lib\/auth-server["'];/,
  `import {
  forbidden,
  getAuthUser,
  hasRole,
  isSuperAdmin,
  isFinancialUser,
  unauthorized,
} from "@/lib/auth-server";`
);

fs.writeFileSync('app/api/accounts/route.ts', code, 'utf8');
console.log('Fixed imports in app/api/accounts/route.ts!');
