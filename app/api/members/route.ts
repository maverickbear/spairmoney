import { NextResponse } from "next/server";
import { getHouseholdMembers, inviteMember, isAdmin } from "@/lib/api/members";
import { MemberInviteFormData } from "@/lib/validations/member";
import { memberInviteSchema } from "@/lib/validations/member";
import { createServerClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is owner or member
    let ownerId = authUser.id; // Default to user being the owner

    // Check if user owns a household
    const { data: ownedHousehold } = await supabase
      .from("HouseholdMember")
      .select("ownerId")
      .eq("ownerId", authUser.id)
      .limit(1)
      .maybeSingle();

    // If user doesn't own a household, get the ownerId from their membership
    if (!ownedHousehold) {
      const { data: memberHousehold } = await supabase
        .from("HouseholdMember")
        .select("ownerId")
        .eq("memberId", authUser.id)
        .eq("status", "active")
        .maybeSingle();

      if (memberHousehold) {
        ownerId = memberHousehold.ownerId;
      }
    }

    const members = await getHouseholdMembers(ownerId);
    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin (owner or admin member) using role from User table
    let { data: user } = await supabase
      .from("User")
      .select("role")
      .eq("id", authUser.id)
      .single();

    // If user doesn't exist or doesn't have role, create/update with admin role (owners are admins)
    if (!user || !user.role) {
      const { error: upsertError } = await supabase
        .from("User")
        .upsert({
          id: authUser.id,
          role: "admin",
          updatedAt: new Date().toISOString(),
        }, {
          onConflict: "id",
        });

      if (!upsertError) {
        user = { role: "admin" };
      }
    }

    const userRole = (user?.role as "admin" | "member") || "admin";

    // If user is not admin, check if they're an admin member of a household
    let ownerId = authUser.id; // Default to user being the owner

    if (userRole !== "admin") {
      // Check if user is an admin member of a household
      const { data: memberHousehold } = await supabase
        .from("HouseholdMember")
        .select("ownerId, role")
        .eq("memberId", authUser.id)
        .eq("status", "active")
        .maybeSingle();

      if (!memberHousehold || memberHousehold.role !== "admin") {
        return NextResponse.json(
          { error: "Only admins can invite members" },
          { status: 403 }
        );
      }

      // Use the ownerId of the household the admin member belongs to
      ownerId = memberHousehold.ownerId;
    }

    const data = await request.json();
    const validatedData = memberInviteSchema.parse(data);
    
    const member = await inviteMember(ownerId, validatedData);
    return NextResponse.json(member);
  } catch (error) {
    console.error("Error inviting member:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid member data", details: error.message },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to invite member";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}



