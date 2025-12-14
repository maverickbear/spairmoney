import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { AppError } from "@/src/application/shared/app-error";

// Force dynamic rendering - this route makes database calls
// Note: Using unstable_noStore() instead of export const dynamic due to cacheComponents compatibility

export async function GET(request: NextRequest) {
  noStore();
  try {
    const service = makeAdminService();
    const users = await service.getAllUsers();
    return NextResponse.json({ users });
  } catch (error: unknown) {
    // Handle prerendering errors gracefully - these are expected during build analysis
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('prerender') || 
        errorMessage.includes('bail out') ||
        errorMessage.includes('NEXT_PRERENDER_INTERRUPTED') ||
        errorMessage.includes('fetch() rejects')) {
      // During prerendering, return empty data
      return NextResponse.json({ users: [] });
    }
    
    console.error("Error fetching users:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    const finalErrorMessage = error instanceof Error ? error.message : "Failed to fetch users";
    return NextResponse.json(
      { error: finalErrorMessage },
      { status: finalErrorMessage.includes("Unauthorized") ? 403 : 500 }
    );
  }
}

