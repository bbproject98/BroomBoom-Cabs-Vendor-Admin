import { NextResponse } from "next/server";
import { adminDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await adminDb.getGlobalStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error("[API STATS ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate dashboard statistics" },
      { status: 500 }
    );
  }
}
