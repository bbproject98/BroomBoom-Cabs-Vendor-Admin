import { NextResponse } from "next/server";
import { adminDb } from "@/lib/db";
import { ManualPaymentPayload } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ManualPaymentPayload;

    if (!body.applicationId) {
      return NextResponse.json(
        { success: false, error: "Application ID is required" },
        { status: 400 }
      );
    }

    if (!body.amount || isNaN(Number(body.amount)) || Number(body.amount) <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid positive payment amount is required" },
        { status: 400 }
      );
    }

    const result = await adminDb.vendor.recordPayment({
      applicationId: body.applicationId.trim(),
      amount: Number(body.amount),
      paymentMode: body.paymentMode || "Cash",
      paymentReference: body.paymentReference?.trim() || `MANUAL-${Date.now().toString().slice(-6)}`,
      paymentDate: body.paymentDate || new Date().toISOString(),
      notes: body.notes?.trim() || "",
      setApproved: Boolean(body.setApproved),
    });

    return NextResponse.json({
      success: true,
      message: body.setApproved
        ? "Manual payment recorded successfully and vendor approved! Login credentials generated."
        : "Manual payment recorded successfully! Lead marked as in-progress.",
      ...result,
    });
  } catch (error: any) {
    console.error("Error recording manual payment:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record manual payment" },
      { status: 500 }
    );
  }
}

