import { NextResponse } from "next/server";
import { adminDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const query = searchParams.get("query") || undefined;
    const applicationId = searchParams.get("applicationId") || undefined;

    const tickets = await adminDb.ticket.getAll({ status, query, applicationId });
    const all = await adminDb.ticket.getAll(applicationId ? { applicationId } : undefined);

    const counts = {
      total: all.length,
      pending: all.filter((t) => (t.status || "").toUpperCase() === "PENDING").length,
      awaitingPayment: all.filter((t) => (t.status || "").toUpperCase() === "AWAITING_PAYMENT").length,
      paymentCompleted: all.filter((t) => (t.status || "").toUpperCase() === "PAYMENT_COMPLETED").length,
      approved: all.filter((t) => ["COMPLETED", "APPROVED"].includes((t.status || "").toUpperCase())).length,
      rejected: all.filter((t) => (t.status || "").toUpperCase() === "REJECTED").length,
    };

    return NextResponse.json({
      success: true,
      tickets,
      counts,
    });
  } catch (error: any) {
    console.error("[API ERROR /api/vendor/tickets GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticketId, action = "step1_approve", adminNotes, paymentId } = body;

    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: "ticketId is required" },
        { status: 400 }
      );
    }

    if (action === "reject") {
      const rejected = await adminDb.ticket.reject(ticketId, adminNotes);
      return NextResponse.json({
        success: true,
        message: `Plan change ticket #${ticketId} rejected.`,
        ticket: rejected,
      });
    }

    // Step 1: Confirm plan & enable Pay Now on vendor dashboard
    if (action === "step1_approve" || action === "approve_plan") {
      const ticket = await adminDb.ticket.step1ApprovePlan(ticketId, adminNotes);
      return NextResponse.json({
        success: true,
        message: `Step 1 Approved: Upgrade request confirmed. Vendor dashboard has now enabled "Pay Now" for ₹${(ticket.totalAmount || 0).toLocaleString("en-IN")}.`,
        ticket,
      });
    }

    // Offline / Manual payment confirmation
    if (action === "mark_paid") {
      const ticket = await adminDb.ticket.markPaymentReceived(ticketId, paymentId);
      return NextResponse.json({
        success: true,
        message: `Payment confirmed as received for Ticket #${ticketId}. Ready for Step 2 Credential Issuance.`,
        ticket,
      });
    }

    // 1-Step Approval: Confirm ticket & payment, generate and issue upgraded credentials
    if (
      action === "approve_and_issue" ||
      action === "step2_issue_creds" ||
      action === "issue_credentials" ||
      action === "approve"
    ) {
      const result = await adminDb.ticket.step2ConfirmPaymentAndIssueCredentials(ticketId, adminNotes);
      return NextResponse.json({
        success: true,
        message: `Plan upgrade confirmed! Upgraded login credentials created for ${result.newCredentials.planName}!`,
        ticket: result.ticket,
        newCredentials: result.newCredentials,
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API ERROR /api/vendor/tickets POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process ticket" },
      { status: 500 }
    );
  }
}

