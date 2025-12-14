import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { makeSubscriptionServicesService } from "@/src/application/subscription-services/subscription-services.factory";
import { AppError } from "@/src/application/shared/app-error";

/**
 * GET /api/subscription-services
 * Get active subscription service categories and services (public endpoint)
 */

// Force dynamic rendering - this route makes database calls
// Note: Using unstable_noStore() instead of export const dynamic due to cacheComponents compatibility

export async function GET() {
  noStore();
  try {
    const service = makeSubscriptionServicesService();
    const result = await service.getCategoriesAndServices();

    return NextResponse.json(result);
  } catch (error: unknown) {
    // Handle prerendering errors gracefully - these are expected during build analysis
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('prerender') || 
        errorMessage.includes('bail out') ||
        errorMessage.includes('NEXT_PRERENDER_INTERRUPTED') ||
        errorMessage.includes('fetch() rejects')) {
      // During prerendering, return empty data
      return NextResponse.json({
        categories: [],
        services: [],
      });
    }
    
    console.error("Error in GET /api/subscription-services:", error);
    
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

