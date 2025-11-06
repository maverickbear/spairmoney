import { NextResponse } from "next/server";
import { resendInvitationEmail, isAdmin } from "@/lib/api/members";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: memberId } = await params;

    // Get member to check ownership and status
    const { data: member, error: memberError } = await supabase
      .from("HouseholdMember")
      .select("ownerId, status")
      .eq("id", memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Check if user is admin (owner or admin member)
    const userIsAdmin = await isAdmin(authUser.id, member.ownerId);
    
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only admins can resend invitations" },
        { status: 403 }
      );
    }

    // Only allow resending for pending invitations
    if (member.status !== "pending") {
      return NextResponse.json(
        { error: "Can only resend invitation for pending members" },
        { status: 400 }
      );
    }

    await resendInvitationEmail(memberId);
    
    return NextResponse.json({ success: true, message: "Invitation email resent successfully" });
  } catch (error) {
    console.error("Error resending invitation email:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to resend invitation email";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

