const fs = require('fs');
let code = fs.readFileSync('app/(workspace)/finance/accounts/components/AccountSlideOverDrawer.tsx', 'utf8');

// Update destructuring in function signature
code = code.replace(
  `  onSave,
  onDelete,
}: AccountSlideOverDrawerProps) {`,
  `  onSave,
  onDelete,
  isSuperAdmin = false,
  isFinancialUser = false,
}: AccountSlideOverDrawerProps) {`
);

// Add security check variables
const targetState = `  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);`;
const replacementState = `  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isTargetLevel1 = mode === "EDIT" ? account?.level === 1 : !parentId;
  const isTargetLevel2 = mode === "EDIT" ? account?.level === 2 : false;
  const isLockedForCurrentUser = (isTargetLevel1 || isTargetLevel2) && !isSuperAdmin;`;

code = code.replace(targetState, replacementState);

// In handleSubmit, prevent submit if locked
const submitCheckTarget = `    if (!accountCode.trim() || !accountName.trim()) {
      toast.warning("Code and Account Name are required.");
      return;
    }`;
const submitCheckReplacement = `    if (isLockedForCurrentUser) {
      toast.error("Level 1 and Level 2 accounts are locked. Only Super Admin can modify them.");
      return;
    }

    if (!accountCode.trim() || !accountName.trim()) {
      toast.warning("Code and Account Name are required.");
      return;
    }`;
code = code.replace(submitCheckTarget, submitCheckReplacement);

// In handleDelete, enforce level 1 and level 2 rules
const deleteCheckTarget = `    if (account.isSystem || (account as any).is_system) {
      toast.error("System control accounts are locked and cannot be deleted.");
      return;
    }`;
const deleteCheckReplacement = `    if (account.level === 1) {
      toast.error("Level 1 root categories cannot be deleted.");
      return;
    }

    if (account.level === 2 && !isSuperAdmin) {
      toast.error("Level 2 group accounts can only be deleted by Super Admin.");
      return;
    }

    if (account.isSystem || (account as any).is_system) {
      toast.error("System control accounts are locked and cannot be deleted.");
      return;
    }`;
code = code.replace(deleteCheckTarget, deleteCheckReplacement);

// In Delete button render, hide for Level 1, and only allow Level 2 if Super Admin
const deleteBtnTarget = `{mode === "EDIT" && account && !account.isSystem && !(account as any).is_system && (`;
const deleteBtnReplacement = `{mode === "EDIT" && account && account.level !== 1 && (account.level !== 2 || isSuperAdmin) && !account.isSystem && !(account as any).is_system && (`;
code = code.replace(deleteBtnTarget, deleteBtnReplacement);

// Disable save button if isLockedForCurrentUser
code = code.replace(
  `disabled={isSubmitting}`,
  `disabled={isSubmitting || isLockedForCurrentUser}`
);

fs.writeFileSync('app/(workspace)/finance/accounts/components/AccountSlideOverDrawer.tsx', code, 'utf8');
console.log('Successfully updated AccountSlideOverDrawer with level security!');
