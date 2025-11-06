import { NextResponse } from "next/server";
import { updateMember, removeMember, isAdmin } from "@/lib/api/members";
import { MemberUpdateFormData } from "@/lib/validations/member";
import { memberUpdateSchema } from "@/lib/validations/member";
import { createServerClient } from "@/lib/supabase-server";

export async function PATCH(
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

    const { id } = await params;

    // Check if this is the owner trying to edit themselves
    if (id === authUser.id) {
      return NextResponse.json(
        { error: "Cannot edit the account owner through this endpoint" },
        { status: 400 }
      );
    }

    // Check if the member exists in HouseholdMember table
    const { data: member } = await supabase
      .from("HouseholdMember")
      .select("ownerId")
      .eq("id", id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: "Cannot edit the account owner through this endpoint" },
        { status: 400 }
      );
    }

    // Check if user is admin (owner is always admin)
    const userIsAdmin = await isAdmin(authUser.id, member.ownerId);
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only admins can edit members" },
        { status: 403 }
      );
    }

    const data = await request.json();
    const validatedData = memberUpdateSchema.parse(data);
    
    const updatedMember = await updateMember(id, validatedData);
    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating member:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid member data", details: error.message },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to update member";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

export async function DELETE(
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

    const { id } = await params;

    // Check if this is the owner trying to delete themselves
    if (id === authUser.id) {
      return NextResponse.json(
        { error: "Cannot remove the account owner" },
        { status: 400 }
      );
    }

    // Check if the member exists in HouseholdMember table
    // If it doesn't exist, it might be the owner
    const { data: member } = await supabase
      .from("HouseholdMember")
      .select("ownerId")
      .eq("id", id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: "Cannot remove the account owner" },
        { status: 400 }
      );
    }

    // Check if user is admin (owner is always admin)
    const userIsAdmin = await isAdmin(authUser.id, member.ownerId);
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Only admins can remove members" },
        { status: 403 }
      );
    }

    await removeMember(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to remove member";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}



