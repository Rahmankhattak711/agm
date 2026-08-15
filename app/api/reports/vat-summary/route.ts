import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sums = await prisma.vatEntry.groupBy({
      by: ["vatType"],
      _sum: { vatAmount: true },
    });

    const result: any = { INPUT: 0, OUTPUT: 0 };
    for (const s of sums) {
      result[s.vatType] = Number(s._sum.vatAmount || 0);
    }

    const net = (result.OUTPUT || 0) - (result.INPUT || 0);

    return NextResponse.json({
      inputVat: result.INPUT,
      outputVat: result.OUTPUT,
      net,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
