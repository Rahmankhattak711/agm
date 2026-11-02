const fs = require('fs');
const filePath = 'lib/navigation.ts';
let c = fs.readFileSync(filePath, 'utf8');

c = c.replace(
  `  "/finance/reports": {
    eyebrow: "Financial Reports",
    title: "Financial Reports",
  },`,
  `  "/finance/reports": {
    eyebrow: "Accounting",
    title: "Reports",
  },`
);

fs.writeFileSync(filePath, c, 'utf8');
console.log('Successfully updated lib/navigation.ts');
