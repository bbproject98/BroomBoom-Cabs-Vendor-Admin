import { NextResponse } from "next/server";
import { adminDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const pkg = searchParams.get("package") || undefined;
    const query = searchParams.get("query") || undefined;

    const leads = await adminDb.franchise.getAll({ status, package: pkg, query });
    return NextResponse.json({ success: true, count: leads.length, leads });
  } catch (error: any) {
    console.error("[API FRANCHISE GET ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch franchise leads" },
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

    const lead = await adminDb.franchise.create(body);
    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error: any) {
    console.error("[API FRANCHISE POST ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create franchise lead" },
      { status: 500 }
    );
  }
}
