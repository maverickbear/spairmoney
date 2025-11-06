import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Find the invitation by token (no auth required)
    const { data: invitation, error: findError } = await supabase
      .from("HouseholdMember")
      .select("id, email, name, role, status, ownerId")
      .eq("invitationToken", token)
      .eq("status", "pending")
      .single();

    if (findError || !invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation token" },
        { status: 404 }
      );
    }

    // Get owner information
    const { data: owner } = await supabase
      .from("User")
      .select("name, email")
      .eq("id", invitation.ownerId)
      .single();

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
      },
      owner: owner ? {
        name: owner.name || owner.email,
        email: owner.email,
      } : null,
    });
  } catch (error) {
    console.error("Error validating invitation:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to validate invitation";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

