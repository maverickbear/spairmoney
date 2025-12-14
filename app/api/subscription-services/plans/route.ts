import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { makeSubscriptionServicesService } from "@/src/application/subscription-services/subscription-services.factory";
import { AppError } from "@/src/application/shared/app-error";

/**
 * GET /api/subscription-services/plans
 * Get active plans for a subscription service (public endpoint)
 */

// Force dynamic rendering - this route uses request.url
// Note: Using unstable_noStore() instead of export const dynamic due to cacheComponents compatibility

export async function GET(request: NextRequest) {
  noStore();
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    const service = makeSubscriptionServicesService();
    const plans = await service.getPlansByServiceId(serviceId);

    return NextResponse.json({ plans });
  } catch (error: unknown) {
    // Handle prerendering errors gracefully - these are expected during build analysis
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('prerender') || 
        errorMessage.includes('bail out') ||
        errorMessage.includes('NEXT_PRERENDER_INTERRUPTED')) {
      // During prerendering, return a default response
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }
    
    console.error("Error in GET /api/subscription-services/plans:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

