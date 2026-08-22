import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEFAULT_ACCOUNTS = [
  { accountCode: "1010", accountName: "Petty Cash", type: "ASSET" },
  { accountCode: "1020", accountName: "RAK Bank", type: "ASSET" },
  { accountCode: "1030", accountName: "Mr.MD Assem-Petty Cash", type: "ASSET" },
  { accountCode: "1200", accountName: "Account Recievable", type: "ASSET" },
  { accountCode: "1210", accountName: "Advance Salary", type: "ASSET" },
  { accountCode: "1300", accountName: "Prepaid Rent", type: "ASSET" },
  { accountCode: "1310", accountName: "Prepaid Staff Visa", type: "ASSET" },

  { accountCode: "1500", accountName: "Office Computer", type: "ASSET" },
  { accountCode: "1501", accountName: "Company Cars-1", type: "ASSET" },
  { accountCode: "1502", accountName: "Company Cars-2", type: "ASSET" },
  { accountCode: "1503", accountName: "Company Cars-3", type: "ASSET" },
  { accountCode: "1504", accountName: "Company Cars-4", type: "ASSET" },
  { accountCode: "1520", accountName: "Office Chair", type: "ASSET" },
  { accountCode: "1521", accountName: "Office Printer", type: "ASSET" },
  { accountCode: "1522", accountName: "Office Table", type: "ASSET" },
  { accountCode: "1599", accountName: "Other Fixed Asset", type: "ASSET" },

  { accountCode: "2000", accountName: "Accounts Payable", type: "LIABILITY" },
  { accountCode: "2100", accountName: "Accrued Salaries", type: "LIABILITY" },
  {
    accountCode: "2200",
    accountName: "VAT Input Tax Payable",
    type: "LIABILITY",
  },
  {
    accountCode: "2210",
    accountName: "VAT Output Tax Payable",
    type: "LIABILITY",
  },
  { accountCode: "2220", accountName: "VAT Payable", type: "LIABILITY" },

  { accountCode: "3000", accountName: "Managing Partner", type: "EQUITY" },
  { accountCode: "3100", accountName: "Current Year Earnings", type: "EQUITY" },

  { accountCode: "4000", accountName: "Service Income", type: "REVENUE" },
  { accountCode: "4010", accountName: "Discount Recieved", type: "REVENUE" },
  { accountCode: "4020", accountName: "Other Inc", type: "REVENUE" },
  { accountCode: "4030", accountName: "Fitout Service Sales", type: "REVENUE" },

  { accountCode: "5010", accountName: "Purchase Materials", type: "EXPENSE" },

  { accountCode: "5000", accountName: "Salaries Exp", type: "EXPENSE" },
  { accountCode: "5001", accountName: "Wages Exp", type: "EXPENSE" },
  { accountCode: "5002", accountName: "Staff Visa Exp", type: "EXPENSE" },
  { accountCode: "5003", accountName: "End Of Service Exp", type: "EXPENSE" },
  { accountCode: "5004", accountName: "Leave Salary Exp", type: "EXPENSE" },
  { accountCode: "5100", accountName: "Rent Exp", type: "EXPENSE" },
  { accountCode: "5200", accountName: "Depreciation Exp", type: "EXPENSE" },
  { accountCode: "5300", accountName: "Garbage Exp", type: "EXPENSE" },
  {
    accountCode: "5310",
    accountName: "Car Maint, Parts, Serv",
    type: "EXPENSE",
  },
  {
    accountCode: "5320",
    accountName: "Credit/Bank Card Charge Exp",
    type: "EXPENSE",
  },
  { accountCode: "5330", accountName: "Discount Allowed Exp", type: "EXPENSE" },
  { accountCode: "5340", accountName: "Etisalat Bill exp", type: "EXPENSE" },
  { accountCode: "5350", accountName: "Combine Expenses", type: "EXPENSE" },
  { accountCode: "5360", accountName: "Food EXP", type: "EXPENSE" },
  { accountCode: "5370", accountName: "Medical Exp", type: "EXPENSE" },
  {
    accountCode: "5380",
    accountName: "Office Stationery Exp",
    type: "EXPENSE",
  },
  { accountCode: "5390", accountName: "Parking Exp", type: "EXPENSE" },
  { accountCode: "5400", accountName: "Petrol Exp", type: "EXPENSE" },
  { accountCode: "5410", accountName: "Transport Exp", type: "EXPENSE" },
  { accountCode: "5420", accountName: "Water Exp", type: "EXPENSE" },
  { accountCode: "5430", accountName: "Salik Bills Exp", type: "EXPENSE" },
  { accountCode: "5440", accountName: "Insurance Exp", type: "EXPENSE" },
  { accountCode: "5450", accountName: "Rental Car Exp", type: "EXPENSE" },
];

export async function GET() {
  try {
    let accounts = await prisma.chartOfAccount.findMany({
      orderBy: { accountCode: "asc" },
    });

    if (accounts.length === 0) {
      await prisma.chartOfAccount.createMany({
        data: DEFAULT_ACCOUNTS.map((a) => ({
          accountCode: a.accountCode,
          accountName: a.accountName,
          type: a.type as any,
          isActive: true,
        })),
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
