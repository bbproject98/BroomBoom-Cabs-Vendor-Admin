import { NextResponse } from "next/server";
import { adminDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const paymentStatus = searchParams.get("paymentStatus") || undefined;
    const tier = searchParams.get("tier") || undefined;
    const query = searchParams.get("query") || undefined;

    const subscriptions = await adminDb.subscription.getAll({
      status,
      paymentStatus,
      tier,
      query,
    });

    const allSubs = await adminDb.subscription.getAll();
    const total = allSubs.length;
    const active = allSubs.filter((s) => s.status === "active").length;
    const pending = allSubs.filter((s) => s.status === "pending").length;
    const paid = allSubs.filter((s) => s.paymentStatus === "PAID").length;
    const totalRevenue = allSubs
      .filter((s) => s.paymentStatus === "PAID" || s.status === "active")
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    return NextResponse.json({
      success: true,
      subscriptions,
      stats: {
        total,
        active,
        pending,
        paid,
        totalRevenue,
      },
    });
  } catch (error: any) {
    console.error("[API ERROR /api/vendor/subscriptions GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch vendor subscriptions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = await adminDb.subscription.create(body);
    return NextResponse.json({
      success: true,
      subscription: created,
    });
  } catch (error: any) {
    console.error("[API ERROR /api/vendor/subscriptions POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create vendor subscription" },
      { status: 500 }
    );
  }
}

