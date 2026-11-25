import { NextResponse } from "next/server";
import { adminDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("query") || "").toLowerCase().trim();
    const tier = searchParams.get("tier") || "all";
    const status = searchParams.get("status") || "all";
    const balance = searchParams.get("balance") || "all"; // 'all' | 'positive' | 'zero'

    let vendors = await adminDb.vendor.getAll();

    if (query) {
      vendors = vendors.filter(
        (v) =>
          v.fullName.toLowerCase().includes(query) ||
          v.mobile.includes(query) ||
          v.applicationId.toLowerCase().includes(query) ||
          (v.city && v.city.toLowerCase().includes(query))
      );
    }

    if (tier !== "all") {
      vendors = vendors.filter(
        (v) => (v.preferredPackage || "silver").toLowerCase() === tier.toLowerCase()
      );
    }

    if (status !== "all") {
      vendors = vendors.filter((v) => v.status === status);
    }

    if (balance === "positive") {
      vendors = vendors.filter((v) => Number(v.walletBalance || 0) > 0);
    } else if (balance === "zero") {
      vendors = vendors.filter((v) => Number(v.walletBalance || 0) <= 0);
    }

    const allVendors = await adminDb.vendor.getAll();
    const totalBalance = allVendors.reduce((acc, v) => acc + Number(v.walletBalance || 0), 0);
    const fundedCount = allVendors.filter((v) => Number(v.walletBalance || 0) > 0).length;

    return NextResponse.json({
      success: true,
      vendors,
      total: vendors.length,
      stats: {
        totalVendors: allVendors.length,
        totalBalance,
        fundedVendors: fundedCount,
        zeroBalanceVendors: allVendors.length - fundedCount,
      },
    });
  } catch (error: any) {
    console.error("Error fetching vendor wallets:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch vendor wallets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { applicationId, type, amount, remarks, adminName = "Super Admin" } = body;

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "Application ID is required" },
        { status: 400 }
      );
    }

    if (amount === undefined || isNaN(Number(amount)) || Number(amount) < 0) {
      return NextResponse.json(
        { success: false, error: "A valid non-negative amount is required" },
        { status: 400 }
      );
    }

    if (!["CREDIT", "DEBIT", "SET"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Action type must be CREDIT, DEBIT, or SET" },
        { status: 400 }
      );
    }

    const result = await adminDb.wallet.updateBalance({
      applicationId: applicationId.trim(),
      amount: Number(amount),
      type,
      remarks: remarks?.trim() || undefined,
      adminName: adminName?.trim() || "Super Admin",
    });

    const msg =
      type === "CREDIT"
        ? `Successfully credited ₹${Number(amount).toLocaleString("en-IN")} to ${result.vendor.fullName}'s wallet.`
        : type === "DEBIT"
        ? `Successfully debited ₹${Number(amount).toLocaleString("en-IN")} from ${result.vendor.fullName}'s wallet.`
        : `Successfully set ${result.vendor.fullName}'s wallet balance to ₹${Number(amount).toLocaleString("en-IN")}.`;

    return NextResponse.json({
      success: true,
      message: msg,
      vendor: result.vendor,
      transaction: result.transaction,
    });
  } catch (error: any) {
    console.error("Error updating vendor wallet:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update vendor wallet" },
      { status: 500 }
    );
  }
}

