const fs = require('fs');
const filePath = 'app/(workspace)/administration/page.tsx';
let c = fs.readFileSync(filePath, 'utf8');
c = c.replace(
  'isSuperAdmin || currentUser?.role === "SUPER_ADMIN"',
  'isSuperAdmin || currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN"'
);
c = c.replace(
  'User provisioning is restricted to the Super Administrator.',
  'User provisioning is restricted to Administrators.'
);
fs.writeFileSync(filePath, c, 'utf8');
console.log('Successfully updated page.tsx permissions!');
