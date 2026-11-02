const fs = require('fs');
let code = fs.readFileSync('app/api/accounts/route.ts', 'utf8');

const target = `    let targetLevel = 1;
    let resolvedType = type;
    if (parentId) {
      const parentAcc = await prisma.chartOfAccount.findUnique({
        where: { id: parentId },
      });
      if (parentAcc) {
        targetLevel = (parentAcc.level || 1) + 1;
        resolvedType = parentAcc.type; // Inherit parent category type
      }
    }

    // Role Enforcement for Levels:
    // Only Super Admin can create Level 1 or Level 2 accounts
    if (targetLevel <= 2 && !isSuper) {
      return forbidden(
        \`Forbidden: Level \${targetLevel} accounts are locked. Only Super Admin can create them.\`,
      );
    }`;

const replacement = `    if (!parentId) {
      return NextResponse.json(
        { error: "A parent Group (Level 2) or Sub-group (Level 3) is required. Root categories cannot be created." },
        { status: 400 },
      );
    }

    const parentAcc = await prisma.chartOfAccount.findUnique({
      where: { id: parentId },
    });

    if (!parentAcc) {
      return NextResponse.json(
        { error: "Selected parent account not found." },
        { status: 400 },
      );
    }

    // Disallow creating direct children under Level 1 categories
    if (parentAcc.level === 1) {
      return NextResponse.json(
        { error: "Cannot create accounts directly under Level 1 root categories (Assets, Liabilities, Equity, etc.). Please select a Level 2 Group or Level 3 Sub-group." },
        { status: 400 },
      );
    }

    const targetLevel = (parentAcc.level || 1) + 1;
    const resolvedType = parentAcc.type; // Inherit parent category type

    // Role Enforcement for Levels:
    // Only Super Admin can create Level 2 accounts
    if (targetLevel <= 2 && !isSuper) {
      return forbidden(
        \`Forbidden: Level \${targetLevel} accounts are locked. Only Super Admin can create them.\`,
      );
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('app/api/accounts/route.ts', code, 'utf8');
console.log('Successfully updated Level 1 parent protection in app/api/accounts/route.ts!');
