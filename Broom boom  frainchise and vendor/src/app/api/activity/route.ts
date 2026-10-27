import { NextResponse } from "next/server";
import { adminDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const actionType = searchParams.get("actionType") || "all";
    const entityType = searchParams.get("entityType") || "all";
    const entityId = searchParams.get("entityId") || searchParams.get("applicationId") || searchParams.get("phone") || "all";
    const query = searchParams.get("query") || searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "150", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const data = await adminDb.activity.getAll({
      actionType,
      entityType,
      entityId,
      query,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      logs: data.logs,
      total: data.total,
      profileGroups: data.profileGroups || [],
    });
  } catch (error: any) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const log = await adminDb.activity.log({
      adminName: body.adminName,
      actionType: body.actionType || "UPDATE",
      entityType: body.entityType || "general",
      entityId: body.entityId || "SYSTEM",
      title: body.title || "Admin Action",
      details: body.details,
    });

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    console.error("Error creating activity log:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create activity log" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await adminDb.activity.clear();
    return NextResponse.json({ success: true, message: "Activity logs cleared" });
  } catch (error: any) {
    console.error("Error clearing activity logs:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to clear activity logs" },
      { status: 500 }
    );
  }
}

