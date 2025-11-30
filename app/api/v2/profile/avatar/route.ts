import { NextRequest, NextResponse } from "next/server";
import { makeProfileService } from "@/src/application/profile/profile.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";

/**
 * POST /api/v2/profile/avatar
 * Upload user avatar image
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const service = makeProfileService();
    const result = await service.uploadAvatar(userId, file, request.headers);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

