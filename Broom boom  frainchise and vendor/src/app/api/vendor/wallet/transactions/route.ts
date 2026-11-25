import { NextResponse } from "next/server";
import { adminDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId") || "all";

    const transactions = await adminDb.wallet.getTransactions(applicationId);

    return NextResponse.json({
      success: true,
      transactions,
      total: transactions.length,
    });
  } catch (error: any) {
    console.error("Error fetching wallet transactions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch wallet transactions" },
      { status: 500 }
    );
  }
}

