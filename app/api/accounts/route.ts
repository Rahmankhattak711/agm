import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEFAULT_ACCOUNTS = [
  { accountCode: "1010", accountName: "Cash on Hand", type: "ASSET" },
  { accountCode: "1020", accountName: "Bank Current Account", type: "ASSET" },
  { accountCode: "1200", accountName: "Accounts Receivable", type: "ASSET" },
  { accountCode: "1500", accountName: "Office Equipment", type: "ASSET" },
  { accountCode: "1510", accountName: "Accumulated Depreciation - Office Equipment", type: "ASSET" },
  { accountCode: "2000", accountName: "Accounts Payable", type: "LIABILITY" },
  { accountCode: "2200", accountName: "VAT Input Tax Payable", type: "LIABILITY" },
  { accountCode: "2210", accountName: "VAT Output Tax Payable", type: "LIABILITY" },
  { accountCode: "3000", accountName: "Owner Equity / Share Capital", type: "EQUITY" },
  { accountCode: "4000", accountName: "Fitout Service Sales", type: "REVENUE" },
  { accountCode: "5000", accountName: "Wages & Salaries Expense", type: "EXPENSE" },
  { accountCode: "5100", accountName: "Rent Expense", type: "EXPENSE" },
  { accountCode: "5200", accountName: "Depreciation Expense", type: "EXPENSE" },
];

export async function GET() {
  try {
    let accounts = await prisma.chartOfAccount.findMany({
      orderBy: { accountCode: "asc" },
    });

    if (accounts.length === 0) {
      // Auto seed
      await prisma.chartOfAccount.createMany({
        data: DEFAULT_ACCOUNTS.map(a => ({
          accountCode: a.accountCode,
          accountName: a.accountName,
          type: a.type as any,
          isActive: true
        }))
      });

      accounts = await prisma.chartOfAccount.findMany({
        orderBy: { accountCode: "asc" },
      });
    }

    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountCode, accountName, type } = body;

    if (!accountCode || !accountName || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const created = await prisma.chartOfAccount.create({
      data: {
        accountCode,
        accountName,
        type,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
