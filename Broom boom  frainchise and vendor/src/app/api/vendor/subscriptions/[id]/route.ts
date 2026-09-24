import { NextResponse } from "next/server";
import { adminDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const subscription = await adminDb.subscription.getById(id);

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: "Vendor subscription not found" },
        { status: 404 }
      );
    }

    // Attempt to also get related vendor lead info
    const relatedLead = await adminDb.vendor.getById(subscription.applicationId);

    return NextResponse.json({
      success: true,
      subscription,
      lead: relatedLead || null,
    });
  } catch (error: any) {
    console.error("[API ERROR /api/vendor/subscriptions/[id] GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch vendor subscription" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const updated = await adminDb.subscription.update(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Failed to update vendor subscription" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: updated,
    });
  } catch (error: any) {
    console.error("[API ERROR /api/vendor/subscriptions/[id] PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update vendor subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const success = await adminDb.subscription.delete(id);

    return NextResponse.json({
      success,
      message: "Vendor subscription deleted successfully",
    });
  } catch (error: any) {
    console.error("[API ERROR /api/vendor/subscriptions/[id] DELETE]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete vendor subscription" },
      { status: 500 }
    );
  }
}

