// This endpoint is no longer needed since deletion is immediate
// Keeping file for backward compatibility but returning error
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/profile/cancel-deletion
 * 
 * No longer available - account deletion is now immediate and cannot be cancelled
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Account deletion is immediate and cannot be cancelled. This endpoint is no longer available." },
    { status: 410 } // 410 Gone
  );
}

