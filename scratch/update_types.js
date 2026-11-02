const fs = require('fs');
const filePath = 'app/(workspace)/administration/types.ts';
let c = fs.readFileSync(filePath, 'utf8');

c = c.replace(
  `  {
    value: "ACCOUNTANT",
    label: "Accountant",
    color: "bg-agm-box-bg text-agm-text border-agm-box-border",
  },`,
  `  {
    value: "ACCOUNTANT",
    label: "Finance / Accountant",
    color: "bg-agm-box-bg text-agm-text border-agm-box-border",
  },`
);

c = c.replace(
  `  {
    value: "HR",
    label: "HR Specialist",
    color: "bg-agm-box-bg text-agm-text border-agm-box-border",
  },`,
  `  {
    value: "HR",
    label: "Operations / HR Specialist",
    color: "bg-agm-box-bg text-agm-text border-agm-box-border",
  },`
);

c = c.replace(
  `  {
    value: "INVENTORY_MANAGER",
    label: "Inventory Manager",
    color: "bg-agm-box-bg text-agm-text border-agm-box-border",
  },`,
  `  {
    value: "INVENTORY_MANAGER",
    label: "Operations / Inventory Manager",
    color: "bg-agm-box-bg text-agm-text border-agm-box-border",
  },`
);

c = c.replace(
  `  {
    value: "USER",
    label: "Standard User",
    color: "bg-agm-box-bg text-agm-muted border-agm-box-border",
  },`,
  `  {
    value: "USER",
    label: "Operations / Standard User",
    color: "bg-agm-box-bg text-agm-muted border-agm-box-border",
  },`
);

fs.writeFileSync(filePath, c, 'utf8');
console.log('Successfully updated types.ts role labels!');
