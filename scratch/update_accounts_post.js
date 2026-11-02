const fs = require('fs');
let code = fs.readFileSync('app/api/accounts/route.ts', 'utf8');

// Update imports
code = code.replace(
  `import {
  forbidden,
  getAuthUser,
  hasRole,
  unauthorized,
} from "@/lib/auth-server";`,
  `import {
  forbidden,
  getAuthUser,
  hasRole,
  isSuperAdmin,
  isFinancialUser,
  unauthorized,
} from "@/lib/auth-server";`
);

// Replace POST implementation
const postSearch = `export async function POST(request: Request) {`;
const postIndex = code.indexOf(postSearch);
if (postIndex === -1) {
  console.error("POST method not found!");
  process.exit(1);
}

const newPost = `export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const isSuper = isSuperAdmin(authUser);
    const isFinancial = isFinancialUser(authUser);

    if (!isFinancial) {
      return forbidden(
        "Forbidden: Only authorized Financial users or Super Admin can create accounts",
      );
    }

    const body = await request.json();
    const {
      accountCode,
      accountName,
      nameAr,
      type,
      parentId,
      isActive,
      cashFlowType,
      enablePayments,
      showInExpenseClaims,
      accountSubtype,
    } = body;

    if (!accountCode || !accountName || !type) {
      return NextResponse.json(
        { error: "Missing required fields: accountCode, accountName, type" },
        { status: 400 },
      );
    }

    let targetLevel = 1;
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
    }

    const existing = await prisma.chartOfAccount.findUnique({
      where: { accountCode: accountCode.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: \`Account code \${accountCode} already exists.\` },
        { status: 409 },
      );
    }

    const created = await prisma.chartOfAccount.create({
      data: {
        accountCode: accountCode.trim(),
        accountName: accountName.trim(),
        nameAr: nameAr ? nameAr.trim() : null,
        type: resolvedType,
        level: targetLevel,
        parentId: parentId || null,
        isActive: isActive ?? true,
        cashFlowType: cashFlowType || "Operating",
        enablePayments: Boolean(enablePayments),
        showInExpenseClaims: Boolean(showInExpenseClaims),
        accountSubtype: accountSubtype || null,
        allowPosting: targetLevel >= 3,
      },
      include: {
        parent: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}`;

code = code.slice(0, postIndex) + newPost;
fs.writeFileSync('app/api/accounts/route.ts', code, 'utf8');
console.log('Successfully updated POST in app/api/accounts/route.ts!');
