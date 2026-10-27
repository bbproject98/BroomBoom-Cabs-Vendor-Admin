import { NextResponse } from "next/server";
import { adminDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");
    const mobile = searchParams.get("mobile");

    if (!applicationId && !mobile) {
      return NextResponse.json(
        { success: false, error: "applicationId or mobile parameter required" },
        { status: 400 }
      );
    }

    const user = await adminDb.vendorUser.getByAppOrMobile((applicationId || mobile)!);

    return NextResponse.json({
      success: true,
      user: user || null,
    });
  } catch (error: any) {
    console.error("[API ERROR /api/vendor/credentials GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch vendor credentials" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      applicationId,
      planTier,
      plan,
      tier,
      preferredPackage,
      customPassword,
      userId,
      password,
      saveCustom,
      reset,
    } = body;

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "applicationId is required" },
        { status: 400 }
      );
    }

    // Lookup lead to check their registered preferred package
    const lead = await adminDb.vendor.getById(applicationId);

    const rawPlan = (
      planTier ||
      plan ||
      tier ||
      preferredPackage ||
      lead?.preferredPackage ||
      lead?.packageName ||
      "silver"
    ).toLowerCase();

    let resolvedTier: "silver" | "gold" | "platinum" = "silver";
    if (rawPlan.includes("plat")) {
      resolvedTier = "platinum";
    } else if (rawPlan.includes("gold")) {
      resolvedTier = "gold";
    } else {
      resolvedTier = "silver";
    }

    let user;
    // If admin explicitly provided custom credentials to save (and it's not a reset request)
    if (!reset && (saveCustom || (userId && password))) {
      user = await adminDb.vendorUser.saveCredentials(
        applicationId,
        userId,
        password,
        resolvedTier
      );
      return NextResponse.json({
        success: true,
        message: `Custom login credentials for ${applicationId} saved successfully.`,
        user,
      });
    }

    // Otherwise generate / regenerate standard credentials
    user = await adminDb.vendorUser.generateCredentials(
      applicationId,
      resolvedTier,
      customPassword
    );

    return NextResponse.json({
      success: true,
      message: `Credentials for ${applicationId} (${resolvedTier.toUpperCase()}) generated successfully.`,
      user,
    });
  } catch (error: any) {
    console.error("[API ERROR /api/vendor/credentials POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process credentials" },
      { status: 500 }
    );
  }
}

