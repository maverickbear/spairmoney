import { NextResponse } from "next/server";
import { updateProfile, getProfile } from "@/lib/api/profile";
import { profileSchema, ProfileFormData } from "@/lib/validations/profile";

export async function GET() {
  try {
    // TODO: When authentication is implemented, get profile from database
    // For now, return null to indicate client should check localStorage
    const profile = await getProfile();
    return NextResponse.json(profile);
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

