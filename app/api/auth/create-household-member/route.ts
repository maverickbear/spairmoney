import { NextRequest, NextResponse } from "next/server";
import { makeMembersService } from "@/src/application/members/members.factory";
import { AppError } from "@/src/application/shared/app-error";

/**
 * POST /api/auth/create-household-member
 * Creates personal household and member record using service role (bypasses RLS)
 * 
 * @deprecated This endpoint is deprecated. Household creation is now automatic in:
 * - signup/signin (via AuthService.createPersonalHousehold)
 * - createUserProfile (via AuthService.createUserProfile)
 * 
 * Keeping for backward compatibility only. Should not be used in new code.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ownerId, memberId, email, name } = body;

    if (!ownerId || !email) {
      return NextResponse.json(
        { error: "ownerId and email are required" },
        { status: 400 }
      );
    }

    const service = makeMembersService();
    const result = await service.createHouseholdMember({
      ownerId,
      memberId,
      email,
      name,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[CREATE-HOUSEHOLD-MEMBER] Unexpected error:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

