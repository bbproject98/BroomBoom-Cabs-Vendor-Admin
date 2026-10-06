import { NextResponse } from "next/server";
import { adminDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "vendor";

    // ============================================================
    // VENDOR SUBSCRIPTIONS EXPORT
    // ============================================================
    if (type === "subscriptions" || type === "vendor-subscriptions") {
      const subs = await adminDb.subscription.getAll();

      const headers = [
        "Subscription ID",
        "Application ID",
        "Vendor Name",
        "Mobile",
        "Email",
        "City",
        "State",
        "Plan Tier",
        "Plan Name",
        "Billing Cycle",
        "Territory Scope",
        "Has Exclusivity",
        "Order ID",
        "Cashfree Order ID",
        "Payment Status",
        "Base Amount (INR)",
        "Gateway Fee (INR)",
        "GST (INR)",
        "Total Amount (INR)",
        "Currency",
        "Paid At",
        "Subscription Status",
        "Start Date",
        "End Date",
        "Admin Notes",
        "Created At",
      ];

      const rows = subs.map((s) => [
        `"${s.subscriptionId}"`,
        `"${s.applicationId}"`,
        `"${(s.vendorName || "").replace(/"/g, '""')}"`,
        `"${s.vendorMobile || ""}"`,
        `"${s.vendorEmail || ""}"`,
        `"${(s.city || "").replace(/"/g, '""')}"`,
        `"${(s.state || "").replace(/"/g, '""')}"`,
        `"${(s.planTier || "").toUpperCase()}"`,
        `"${(s.planName || "").replace(/"/g, '""')}"`,
        `"${(s.billingCycle || "").replace(/"/g, '""')}"`,
        `"${(s.territoryScope || "").replace(/"/g, '""')}"`,
        `"${s.hasExclusivity ? "YES" : "NO"}"`,
        `"${s.orderId}"`,
        `"${s.cfOrderId || ""}"`,
        `"${(s.paymentStatus || "").toUpperCase()}"`,
        `"${s.baseAmount}"`,
        `"${s.gatewayFee}"`,
        `"${s.gstAmount}"`,
        `"${s.totalAmount}"`,
        `"${s.currency}"`,
        `"${s.paidAt || ""}"`,
        `"${(s.status || "").toUpperCase()}"`,
        `"${s.startDate}"`,
        `"${s.endDate || ""}"`,
        `"${(s.adminNotes || "").replace(/"/g, '""')}"`,
        `"${s.createdAt}"`,
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\r\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="broomboom-vendor-subscriptions-${Date.now()}.csv"`,
        },
      });
    }

    // ============================================================
    // VENDOR LEADS EXPORT
    // ============================================================
    if (type === "vendor") {
      const vendorLeads = await adminDb.vendor.getAll();

      const headers = [
        "Application ID",
        "Vendor Name",
        "Mobile",
        "Alternate Phone",
        "Email",
        "State",
        "City",
        "Pin Code",
        "Office Space",
        "Carpet Area",
        "Fleet Tier",
        "Investment Budget",
        "Finance Required",
        "Experience",
        "Status",
        "Admin Notes",
        "Registered At",
      ];

      const rows = vendorLeads.map((l) => [
        `"${l.applicationId}"`,
        `"${(l.fullName || "").replace(/"/g, '""')}"`,
        `"${l.mobile || ""}"`,
        `"${l.alternatePhone || ""}"`,
        `"${l.email || ""}"`,
        `"${(l.state || "").replace(/"/g, '""')}"`,
        `"${(l.city || "").replace(/"/g, '""')}"`,
        `"${l.pincode || ""}"`,
        `"${(l.spaceStatus || "").replace(/"/g, '""')}"`,
        `"${(l.carpetArea || "").replace(/"/g, '""')}"`,
        `"${(l.preferredPackage || "").toUpperCase()}"`,
        `"${(l.investmentBudget || "").replace(/"/g, '""')}"`,
        `"${(l.financeRequired || "").replace(/"/g, '""')}"`,
        `"${(l.hasExperience || "").replace(/"/g, '""')}"`,
        `"${l.status.toUpperCase()}"`,
        `"${(l.adminNotes || "").replace(/"/g, '""')}"`,
        `"${l.createdAt}"`,
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\r\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="broomboom-vendor-leads-${Date.now()}.csv"`,
        },
      });
    }

    // ============================================================
    // FRANCHISE LEADS EXPORT
    // ============================================================
    if (type === "franchise") {
      const franchiseLeads = await adminDb.franchise.getAll();
      const headers = [
        "Application ID",
        "Applicant Name",
        "Mobile",
        "Alternate Phone",
        "Email",
        "State",
        "City",
        "Pin Code",
        "Commercial Space",
        "Carpet Area",
        "Franchise Package",
        "Investment Budget",
        "Finance Required",
        "Loan Assistance",
        "Experience",
        "Status",
        "Admin Notes",
        "Applied At",
      ];

      const rows = franchiseLeads.map((l) => [
        `"${l.applicationId}"`,
        `"${(l.fullName || "").replace(/"/g, '""')}"`,
        `"${l.mobile || ""}"`,
        `"${l.alternatePhone || ""}"`,
        `"${l.email || ""}"`,
        `"${(l.state || "").replace(/"/g, '""')}"`,
        `"${(l.city || "").replace(/"/g, '""')}"`,
        `"${l.pincode || ""}"`,
        `"${(l.spaceStatus || "").replace(/"/g, '""')}"`,
        `"${(l.carpetArea || "").replace(/"/g, '""')}"`,
        `"${(l.packageName || l.preferredPackage || "").replace(/"/g, '""')}"`,
        `"${(l.investmentBudget || "").replace(/"/g, '""')}"`,
        `"${(l.financeRequired || "").replace(/"/g, '""')}"`,
        `"${(l.loanAssistance || "").replace(/"/g, '""')}"`,
        `"${(l.hasExperience || "").replace(/"/g, '""')}"`,
        `"${l.status.toUpperCase()}"`,
        `"${(l.adminNotes || "").replace(/"/g, '""')}"`,
        `"${l.createdAt}"`,
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="broomboom-franchise-leads-${Date.now()}.csv"`,
        },
      });
    }

    // ============================================================
    // INVALID EXPORT TYPE
    // ============================================================
    return NextResponse.json(
      {
        success: false,
        error:
          "Invalid export type. Supported types: franchise, vendor, subscriptions",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Export error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to export data",
      },
      { status: 500 }
    );
  }
}