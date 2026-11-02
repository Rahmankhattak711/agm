import { prisma } from '../lib/prisma';
type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

interface AccountDef {
  code: string;
  name: string;
  nameAr?: string;
  type: AccountType;
  level: number;
  parentCode: string | null;
  allowPosting: boolean;
  enablePayments?: boolean;
  showInExpenseClaims?: boolean;
  cashFlowType?: string;
  subtype?: string;
  isSystem?: boolean;
}

const WAFEQ_ACCOUNTS_SEED: AccountDef[] = [
  // ==========================================
  // LEVEL 1: TOP CATEGORIES (Full-width Pastel)
  // ==========================================
  { code: '1', name: 'Assets', nameAr: 'الأصول', type: 'ASSET', level: 1, parentCode: null, allowPosting: false },
  { code: '2', name: 'Liabilities', nameAr: 'الخصوم', type: 'LIABILITY', level: 1, parentCode: null, allowPosting: false },
  { code: '3', name: 'Equity', nameAr: 'حقوق الملكية', type: 'EQUITY', level: 1, parentCode: null, allowPosting: false },
  { code: '4', name: 'Revenue', nameAr: 'الإيرادات', type: 'REVENUE', level: 1, parentCode: null, allowPosting: false },
  { code: '5', name: 'Expenses', nameAr: 'المصروفات', type: 'EXPENSE', level: 1, parentCode: null, allowPosting: false },

  // ==========================================
  // LEVEL 2: GROUPS
  // ==========================================
  // Under 1 Assets:
  { code: '11', name: 'Current assets', nameAr: 'الأصول المتداولة', type: 'ASSET', level: 2, parentCode: '1', allowPosting: false, subtype: 'Current assets' },
  { code: '12', name: 'Non-current assets', nameAr: 'الأصول غير المتداولة', type: 'ASSET', level: 2, parentCode: '1', allowPosting: false, subtype: 'Non-current assets' },

  // Under 2 Liabilities:
  { code: '21', name: 'Current liabilities', nameAr: 'الالتزامات المتداولة', type: 'LIABILITY', level: 2, parentCode: '2', allowPosting: false, subtype: 'Current liabilities' },
  { code: '22', name: 'Non-current liabilities', nameAr: 'الالتزامات غير المتداولة', type: 'LIABILITY', level: 2, parentCode: '2', allowPosting: false, subtype: 'Non-current liabilities' },

  // Under 3 Equity:
  { code: '31', name: 'Opening balance equity', nameAr: 'رصيد الافتتاح', type: 'EQUITY', level: 2, parentCode: '3', allowPosting: false, subtype: 'Equity' },
  { code: '32', name: "Owner's equity", nameAr: 'حقوق المالك', type: 'EQUITY', level: 2, parentCode: '3', allowPosting: false, subtype: 'Equity' },
  { code: '33', name: 'Retained earnings', nameAr: 'الأرباح المبقاة', type: 'EQUITY', level: 2, parentCode: '3', allowPosting: false, subtype: 'Equity' },

  // Under 4 Revenue:
  { code: '41', name: 'Income', nameAr: 'الدخل', type: 'REVENUE', level: 2, parentCode: '4', allowPosting: false, subtype: 'Operating income' },
  { code: '42', name: 'Other income', nameAr: 'الدخل الآخر', type: 'REVENUE', level: 2, parentCode: '4', allowPosting: false, subtype: 'Other income' },

  // Under 5 Expenses:
  { code: '51', name: 'Cost of sales', nameAr: 'تكلفة المبيعات', type: 'EXPENSE', level: 2, parentCode: '5', allowPosting: false, subtype: 'Cost of sales' },
  { code: '52', name: 'Operating expenses', nameAr: 'المصاريف التشغيلية', type: 'EXPENSE', level: 2, parentCode: '5', allowPosting: false, subtype: 'Operating expenses' },
  { code: '53', name: 'Non-operating expenses', nameAr: 'المصاريف غير التشغيلية', type: 'EXPENSE', level: 2, parentCode: '5', allowPosting: false, subtype: 'Non-operating expenses' },

  // ==========================================
  // LEVEL 3: SUB-GROUPS
  // ==========================================
  // Under 11 Current assets:
  { code: '111', name: 'Cash and cash equivalents', nameAr: 'النقد وما في حكمه', type: 'ASSET', level: 3, parentCode: '11', allowPosting: false, cashFlowType: 'Cash & cash equivalents' },
  { code: '112', name: 'Accounts receivable', nameAr: 'المدينون التجاريون', type: 'ASSET', level: 3, parentCode: '11', allowPosting: false, cashFlowType: 'Operating' },
  { code: '113', name: 'Prepayments and other current assets', nameAr: 'المدفوعات المقدمة والأصول المتداولة الأخرى', type: 'ASSET', level: 3, parentCode: '11', allowPosting: false, cashFlowType: 'Operating' },
  { code: '114', name: 'Inventory', nameAr: 'المخزون', type: 'ASSET', level: 3, parentCode: '11', allowPosting: false, cashFlowType: 'Operating' },

  // Under 12 Non-current assets:
  { code: '121', name: 'Fixed asset', nameAr: 'الأصول الثابتة', type: 'ASSET', level: 3, parentCode: '12', allowPosting: false, cashFlowType: 'Investing' },
  { code: '122', name: 'Other non-current assets', nameAr: 'الأصول غير المتداولة الأخرى', type: 'ASSET', level: 3, parentCode: '12', allowPosting: false, cashFlowType: 'Investing' },

  // Under 21 Current liabilities:
  { code: '211', name: 'Accounts payable', nameAr: 'الدائنون التجاريون', type: 'LIABILITY', level: 3, parentCode: '21', allowPosting: false, cashFlowType: 'Operating' },
  { code: '212', name: 'Taxes payable', nameAr: 'الضرائب المستحقة الدفع', type: 'LIABILITY', level: 3, parentCode: '21', allowPosting: false, cashFlowType: 'Operating' },
  { code: '213', name: 'Accrued expenses and other current liabilities', nameAr: 'المصروفات المستحقة والالتزامات المتداولة الأخرى', type: 'LIABILITY', level: 3, parentCode: '21', allowPosting: false, cashFlowType: 'Operating' },

  // Under 22 Non-current liabilities:
  { code: '221', name: 'Long-term liabilities', nameAr: 'الالتزامات طويلة الأجل', type: 'LIABILITY', level: 3, parentCode: '22', allowPosting: false, cashFlowType: 'Financing' },

  // Under 31 Opening balance equity:
  { code: '311', name: 'Opening balance equity group', nameAr: 'مجموعة الأرصدة الافتتاحية', type: 'EQUITY', level: 3, parentCode: '31', allowPosting: false, cashFlowType: 'Financing' },

  // Under 32 Owner's equity:
  { code: '321', name: 'Owner capital and drawings', nameAr: 'رأس المال والمسحوبات', type: 'EQUITY', level: 3, parentCode: '32', allowPosting: false, cashFlowType: 'Financing' },

  // Under 33 Retained earnings:
  { code: '331', name: 'Retained earnings group', nameAr: 'مجموعة الأرباح المبقاة', type: 'EQUITY', level: 3, parentCode: '33', allowPosting: false, cashFlowType: 'Financing' },

  // Under 41 Income:
  { code: '411', name: 'Operating revenue', nameAr: 'إيرادات العمليات', type: 'REVENUE', level: 3, parentCode: '41', allowPosting: false, cashFlowType: 'Operating' },

  // Under 42 Other income:
  { code: '421', name: 'Other income & gains', nameAr: 'إيرادات ومكاسب أخرى', type: 'REVENUE', level: 3, parentCode: '42', allowPosting: false, cashFlowType: 'Operating' },

  // Under 51 Cost of sales:
  { code: '511', name: 'Direct material & subcontractor costs', nameAr: 'تكاليف المواد والعمالة المباشرة', type: 'EXPENSE', level: 3, parentCode: '51', allowPosting: false, cashFlowType: 'Operating' },

  // Under 52 Operating expenses:
  { code: '521', name: 'General and administrative', nameAr: 'المصاريف العامة والإدارية', type: 'EXPENSE', level: 3, parentCode: '52', allowPosting: false, cashFlowType: 'Operating' },
  { code: '522', name: 'Payroll and staff expenses', nameAr: 'الرواتب ومستحقات الموظفين', type: 'EXPENSE', level: 3, parentCode: '52', allowPosting: false, cashFlowType: 'Operating' },
  { code: '523', name: 'Rent and facility expenses', nameAr: 'الإيجارات والمرافق', type: 'EXPENSE', level: 3, parentCode: '52', allowPosting: false, cashFlowType: 'Operating' },

  // Under 53 Non-operating expenses:
  { code: '531', name: 'Bank charges and financial costs', nameAr: 'الرسوم البنكية وتكاليف التمويل', type: 'EXPENSE', level: 3, parentCode: '53', allowPosting: false, cashFlowType: 'Operating' },

  // ==========================================
  // LEVEL 4: POSTING LEDGER ACCOUNTS
  // ==========================================
  // Under 111 Cash & Cash Equivalents:
  { code: '1010', name: 'Cash on Hand', nameAr: 'النقدية في الخزينة', type: 'ASSET', level: 4, parentCode: '111', allowPosting: true, enablePayments: true, cashFlowType: 'Cash & cash equivalents', subtype: 'Bank', isSystem: true },
  { code: '1020', name: 'RAK Bank', nameAr: 'بنك رأس الخيمة', type: 'ASSET', level: 4, parentCode: '111', allowPosting: true, enablePayments: true, cashFlowType: 'Cash & cash equivalents', subtype: 'Bank', isSystem: true },
  { code: '1111', name: 'Undeposited funds', nameAr: 'أموال غير مودعة', type: 'ASSET', level: 4, parentCode: '111', allowPosting: true, enablePayments: true, cashFlowType: 'Cash & cash equivalents', subtype: 'Bank', isSystem: false },
  { code: '1112', name: 'Petty Cash', nameAr: 'صندوق العهدة والمصروفات النثرية', type: 'ASSET', level: 4, parentCode: '111', allowPosting: true, enablePayments: true, cashFlowType: 'Cash & cash equivalents', subtype: 'Bank', isSystem: true },

  // Under 112 Accounts receivable:
  { code: '1200', name: 'Account Receivable', nameAr: 'حسابات المدينين', type: 'ASSET', level: 4, parentCode: '112', allowPosting: true, cashFlowType: 'Operating', subtype: 'Accounts receivable', isSystem: true },

  // Under 113 Prepayments and other current assets:
  { code: '1131', name: 'Prepaid expenses', nameAr: 'المصروفات المدفوعة مقدماً', type: 'ASSET', level: 4, parentCode: '113', allowPosting: true, cashFlowType: 'Operating', subtype: 'Other current assets' },
  { code: '1132', name: 'Employee advances', nameAr: 'سلف الموظفين', type: 'ASSET', level: 4, parentCode: '113', allowPosting: true, cashFlowType: 'Operating', subtype: 'Other current assets' },

  // Under 114 Inventory:
  { code: '1141', name: 'Inventory Asset', nameAr: 'بضاعة المخزن', type: 'ASSET', level: 4, parentCode: '114', allowPosting: true, cashFlowType: 'Operating', subtype: 'Inventory' },

  // Under 121 Fixed assets:
  { code: '1211', name: 'Furniture and equipment', nameAr: 'الأثاث والتجهيزات', type: 'ASSET', level: 4, parentCode: '121', allowPosting: true, cashFlowType: 'Investing', subtype: 'Fixed assets' },
  { code: '1212', name: 'Vehicles', nameAr: 'السيارات والشاحنات', type: 'ASSET', level: 4, parentCode: '121', allowPosting: true, cashFlowType: 'Investing', subtype: 'Fixed assets' },
  { code: '1213', name: 'Computers and software', nameAr: 'أجهزة الكمبيوتر والبرمجيات', type: 'ASSET', level: 4, parentCode: '121', allowPosting: true, cashFlowType: 'Investing', subtype: 'Fixed assets' },
  { code: '1214', name: 'Accumulated depreciation', nameAr: 'مجمع الإهلاك', type: 'ASSET', level: 4, parentCode: '121', allowPosting: true, cashFlowType: 'Investing', subtype: 'Fixed assets' },

  // Under 122 Other non-current assets:
  { code: '1221', name: 'Security deposits', nameAr: 'التأمينات المستردة', type: 'ASSET', level: 4, parentCode: '122', allowPosting: true, cashFlowType: 'Investing', subtype: 'Other non-current assets' },

  // Under 211 Accounts payable:
  { code: '2000', name: 'Accounts Payable', nameAr: 'حسابات الدائنين', type: 'LIABILITY', level: 4, parentCode: '211', allowPosting: true, cashFlowType: 'Operating', subtype: 'Accounts payable', isSystem: true },

  // Under 212 Taxes payable:
  { code: '2200', name: 'VAT Input Tax Payable', nameAr: 'ضريبة المدخلات', type: 'LIABILITY', level: 4, parentCode: '212', allowPosting: true, cashFlowType: 'Operating', subtype: 'Other current liabilities', isSystem: true },
  { code: '2210', name: 'VAT Output Tax Payable', nameAr: 'ضريبة المخرجات', type: 'LIABILITY', level: 4, parentCode: '212', allowPosting: true, cashFlowType: 'Operating', subtype: 'Other current liabilities', isSystem: true },
  { code: '2220', name: 'FTA Net VAT Payable', nameAr: 'صافي ضريبة القيمة المضافة', type: 'LIABILITY', level: 4, parentCode: '212', allowPosting: true, cashFlowType: 'Operating', subtype: 'Other current liabilities' },

  // Under 213 Accrued expenses & other liabilities:
  { code: '2131', name: 'Accrued expenses', nameAr: 'المصروفات المستحقة', type: 'LIABILITY', level: 4, parentCode: '213', allowPosting: true, cashFlowType: 'Operating', subtype: 'Other current liabilities' },
  { code: '2132', name: 'Salaries payable', nameAr: 'الرواتب المستحقة', type: 'LIABILITY', level: 4, parentCode: '213', allowPosting: true, cashFlowType: 'Operating', subtype: 'Other current liabilities' },
  { code: '2133', name: 'Deferred revenue', nameAr: 'الإيرادات المؤجلة', type: 'LIABILITY', level: 4, parentCode: '213', allowPosting: true, cashFlowType: 'Operating', subtype: 'Other current liabilities' },

  // Under 221 Long term liabilities:
  { code: '2211', name: 'Bank loans and financing', nameAr: 'قروض وتسهيلات بنكية', type: 'LIABILITY', level: 4, parentCode: '221', allowPosting: true, cashFlowType: 'Financing', subtype: 'Long-term liabilities' },

  // Under 311 Opening balance equity:
  { code: '3110', name: 'Opening balance equity', nameAr: 'الرصيد الافتتاحي للحقوق', type: 'EQUITY', level: 4, parentCode: '311', allowPosting: true, cashFlowType: 'Financing', subtype: 'Equity' },

  // Under 321 Capital & Drawings:
  { code: '3210', name: "Owner's capital", nameAr: 'رأس مال الشركاء', type: 'EQUITY', level: 4, parentCode: '321', allowPosting: true, cashFlowType: 'Financing', subtype: 'Equity' },
  { code: '3220', name: "Owner's drawings", nameAr: 'مسحوبات الشركاء', type: 'EQUITY', level: 4, parentCode: '321', allowPosting: true, cashFlowType: 'Financing', subtype: 'Equity' },

  // Under 331 Retained earnings:
  { code: '3310', name: 'Retained earnings', nameAr: 'الأرباح المحتجزة', type: 'EQUITY', level: 4, parentCode: '331', allowPosting: true, cashFlowType: 'Financing', subtype: 'Equity' },

  // Under 411 Operating revenue:
  { code: '4000', name: 'Service Income', nameAr: 'إيراد الخدمات والمقاولات', type: 'REVENUE', level: 4, parentCode: '411', allowPosting: true, cashFlowType: 'Operating', subtype: 'Operating income', isSystem: true },
  { code: '4110', name: 'Fitout contracting revenue', nameAr: 'إيرادات مشاريع الديكور والمقاولات', type: 'REVENUE', level: 4, parentCode: '411', allowPosting: true, cashFlowType: 'Operating', subtype: 'Operating income' },

  // Under 421 Other income:
  { code: '4210', name: 'Interest income', nameAr: 'فوائد بنكية دائنة', type: 'REVENUE', level: 4, parentCode: '421', allowPosting: true, cashFlowType: 'Operating', subtype: 'Other income' },
  { code: '4220', name: 'Gain on foreign exchange', nameAr: 'أرباح فروق عملة', type: 'REVENUE', level: 4, parentCode: '421', allowPosting: true, cashFlowType: 'Operating', subtype: 'Other income' },

  // Under 511 Cost of sales:
  { code: '5010', name: 'Purchase Materials', nameAr: 'مشتريات مواد ومهمات المشاريع', type: 'EXPENSE', level: 4, parentCode: '511', allowPosting: true, cashFlowType: 'Operating', subtype: 'Cost of sales', isSystem: true },
  { code: '5120', name: 'Subcontractor costs', nameAr: 'تكاليف مقاولي الباطن', type: 'EXPENSE', level: 4, parentCode: '511', allowPosting: true, cashFlowType: 'Operating', subtype: 'Cost of sales' },

  // Under 521 General & administrative:
  { code: '5211', name: 'Office supplies', nameAr: 'أدوات ومستلزمات مكتبية', type: 'EXPENSE', level: 4, parentCode: '521', allowPosting: true, showInExpenseClaims: true, cashFlowType: 'Operating', subtype: 'Operating expenses' },
  { code: '5212', name: 'Marketing and advertising', nameAr: 'الدعاية والتسويق', type: 'EXPENSE', level: 4, parentCode: '521', allowPosting: true, showInExpenseClaims: true, cashFlowType: 'Operating', subtype: 'Operating expenses' },
  { code: '5213', name: 'Travel and entertainment', nameAr: 'السفر والضيافة', type: 'EXPENSE', level: 4, parentCode: '521', allowPosting: true, showInExpenseClaims: true, cashFlowType: 'Operating', subtype: 'Operating expenses' },
  { code: '5214', name: 'Depreciation expense', nameAr: 'مصروف إهلاك الأصول', type: 'EXPENSE', level: 4, parentCode: '521', allowPosting: true, cashFlowType: 'Operating', subtype: 'Operating expenses' },

  // Under 522 Payroll:
  { code: '5221', name: 'Salaries and wages', nameAr: 'رواتب وأجور الموظفين', type: 'EXPENSE', level: 4, parentCode: '522', allowPosting: true, showInExpenseClaims: true, cashFlowType: 'Operating', subtype: 'Operating expenses' },
  { code: '5222', name: 'Staff visa and medical insurance', nameAr: 'تكاليف الإقامات والتأمين الصحي', type: 'EXPENSE', level: 4, parentCode: '522', allowPosting: true, cashFlowType: 'Operating', subtype: 'Operating expenses' },

  // Under 523 Facility:
  { code: '5231', name: 'Rent expense', nameAr: 'مصروف الإيجار', type: 'EXPENSE', level: 4, parentCode: '523', allowPosting: true, cashFlowType: 'Operating', subtype: 'Operating expenses' },
  { code: '5232', name: 'Utilities expense (DEWA/Water)', nameAr: 'كهرباء ومياه ومرافق', type: 'EXPENSE', level: 4, parentCode: '523', allowPosting: true, cashFlowType: 'Operating', subtype: 'Operating expenses' },
  { code: '5233', name: 'Telecom and Internet', nameAr: 'اتصالات وانترنت', type: 'EXPENSE', level: 4, parentCode: '523', allowPosting: true, cashFlowType: 'Operating', subtype: 'Operating expenses' },

  // Under 531 Financial:
  { code: '5311', name: 'Bank fees and charges', nameAr: 'المصاريف والعمولات البنكية', type: 'EXPENSE', level: 4, parentCode: '531', allowPosting: true, cashFlowType: 'Operating', subtype: 'Non-operating expenses' },
  { code: '5312', name: 'Loss on foreign exchange', nameAr: 'خسائر فروق عملة', type: 'EXPENSE', level: 4, parentCode: '531', allowPosting: true, cashFlowType: 'Operating', subtype: 'Non-operating expenses' },
];

export async function seedWafeqChartOfAccounts() {
  console.log(`[COA Seed] Starting UAE FTA / Wafeq Chart of Accounts seed...`);

  // Map to track code -> UUID for hierarchy linking
  const codeToIdMap = new Map<string, string>();

  // Fetch existing accounts to preserve IDs
  const existingAccounts = await prisma.chartOfAccount.findMany({
    select: { id: true, accountCode: true },
  });
  for (const acc of existingAccounts) {
    codeToIdMap.set(acc.accountCode, acc.id);
  }

  // We seed level by level: 1 -> 2 -> 3 -> 4
  for (let currentLevel = 1; currentLevel <= 4; currentLevel++) {
    const levelAccounts = WAFEQ_ACCOUNTS_SEED.filter((a) => a.level === currentLevel);
    console.log(`[COA Seed] Seeding Level ${currentLevel} (${levelAccounts.length} accounts)...`);

    for (const acc of levelAccounts) {
      const parentId = acc.parentCode ? codeToIdMap.get(acc.parentCode) || null : null;

      const existingId = codeToIdMap.get(acc.code);
      if (existingId) {
        // Update existing record, preserving ID so foreign keys don't break
        const updated = await prisma.chartOfAccount.update({
          where: { id: existingId },
          data: {
            accountName: acc.name,
            nameAr: acc.nameAr,
            type: acc.type,
            level: acc.level,
            parentId: parentId,
            allowPosting: acc.allowPosting,
            enablePayments: Boolean(acc.enablePayments),
            showInExpenseClaims: Boolean(acc.showInExpenseClaims),
            cashFlowType: acc.cashFlowType || 'Operating',
            accountSubtype: acc.subtype || null,
            isSystem: Boolean(acc.isSystem),
            isActive: true,
          },
        });
        codeToIdMap.set(acc.code, updated.id);
      } else {
        // Create new account
        const created = await prisma.chartOfAccount.create({
          data: {
            accountCode: acc.code,
            accountName: acc.name,
            nameAr: acc.nameAr,
            type: acc.type,
            level: acc.level,
            parentId: parentId,
            allowPosting: acc.allowPosting,
            enablePayments: Boolean(acc.enablePayments),
            showInExpenseClaims: Boolean(acc.showInExpenseClaims),
            cashFlowType: acc.cashFlowType || 'Operating',
            accountSubtype: acc.subtype || null,
            isSystem: Boolean(acc.isSystem),
            isActive: true,
          },
        });
        codeToIdMap.set(acc.code, created.id);
      }
    }
  }

  const finalTotal = await prisma.chartOfAccount.count();
  console.log(`[COA Seed] Successfully completed! Total accounts in DB: ${finalTotal}`);
}

async function main() {
  await seedWafeqChartOfAccounts();
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error('[COA Seed Error]:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
