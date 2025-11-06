import { NextResponse } from "next/server";
import { updateProfile, getProfile } from "@/lib/api/profile";
import { profileSchema, ProfileFormData } from "@/lib/validations/profile";
import { createServerClient } from "@/lib/supabase-server";
import { getUserPlanInfo } from "@/lib/api/plans";
import { getUserHouseholdInfo } from "@/lib/api/members";

export interface ProfileWithPlan {
  name: string;
  email: string;
  avatarUrl?: string;
  phoneNumber?: string;
  plan: {
    name: "free" | "basic" | "premium";
    isShadow: boolean;
    ownerId?: string;
    ownerName?: string;
  } | null;
  household: {
    isOwner: boolean;
    isMember: boolean;
    ownerId?: string;
    ownerName?: string;
  } | null;
}

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

    // Get profile information
    const profile = await getProfile();
    
    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Get plan information
    const planInfo = await getUserPlanInfo(authUser.id);
    
    // Get household information
    const householdInfo = await getUserHouseholdInfo(authUser.id);

    const profileWithPlan: ProfileWithPlan = {
      ...profile,
      plan: planInfo,
      household: householdInfo,
    };

    return NextResponse.json(profileWithPlan);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    
    // Validate the data
    const validatedData = profileSchema.parse(data);
    
    // TODO: When authentication is implemented, save to database
    // For now, validate and return the profile data
    const profile = await updateProfile(validatedData);
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error updating profile:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid profile data", details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

