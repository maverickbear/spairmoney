import { NextRequest, NextResponse } from "next/server";
import { inviteMember } from "@/lib/api/members";
import { memberInviteSchema, MemberInviteFormData } from "@/lib/validations/member";
import { getCurrentUserId } from "@/lib/api/feature-guard";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    // Get current user ID
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const data: MemberInviteFormData = memberInviteSchema.parse(body);

    // Invite the member
    const member = await inviteMember(userId, data);

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Error inviting member:", error);

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') },
        { status: 400 }
      );
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : "Failed to invite member";
    const statusCode = errorMessage.includes("Unauthorized") ? 401 : 400;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

