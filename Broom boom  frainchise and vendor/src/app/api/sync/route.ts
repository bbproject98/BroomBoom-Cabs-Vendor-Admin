import { NextResponse } from "next/server";
import { syncSiblingLandingPageStores } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = syncSiblingLandingPageStores();
    return NextResponse.json({
      success: true,
      message: "Synced data successfully from landing page stores",
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
