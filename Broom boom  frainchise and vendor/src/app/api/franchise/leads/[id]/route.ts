import { NextResponse } from "next/server";
import { adminDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await adminDb.franchise.getById(params.id);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Franchise lead not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = await adminDb.franchise.update(params.id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Franchise lead not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ok = await adminDb.franchise.delete(params.id);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
