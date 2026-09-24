import { NextResponse } from "next/server";
import { adminDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const tier = searchParams.get("tier") || undefined;
    const query = searchParams.get("query") || undefined;

    const leads = await adminDb.vendor.getAll({ status, tier, query });
    return NextResponse.json({ success: true, count: leads.length, leads });
  } catch (error: any) {
    console.error("[API VENDOR GET ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vendor leads" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.fullName || !body.mobile || !body.city) {
      return NextResponse.json(
        { success: false, error: "Full Name, Mobile number, and City are required" },
        { status: 400 }
      );
    }

    const lead = await adminDb.vendor.create(body);
    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error: any) {
    console.error("[API VENDOR POST ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create vendor lead" },
      { status: 500 }
    );
  }
}
