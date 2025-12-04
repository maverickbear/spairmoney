import { NextResponse } from "next/server";
import { makeMembersService } from "@/src/application/members/members.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 }
      );
    }

    const service = makeMembersService();
    const member = await service.acceptInvitation(token, userId);
    return NextResponse.json(member);
  } catch (error) {
    console.error("Error accepting invitation:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : "Failed to accept invitation";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}



