"use server";

import { ProfileFormData } from "@/lib/validations/profile";

export interface Profile {
  name: string;
  email: string;
  avatarUrl?: string;
}

// TODO: Migrate to database when authentication is implemented
// For now, this structure is prepared for future database integration
export async function getProfile(): Promise<Profile | null> {
  // TODO: Replace with database query when authentication is implemented
  // Example: const supabase = createServerClient();
  // const { data } = await supabase.from("profiles").select("*").single();
  return null; // Temporary: return null to indicate no profile yet
}

export async function updateProfile(data: ProfileFormData): Promise<Profile> {
  // TODO: Replace with database update when authentication is implemented
  // Example: const supabase = createServerClient();
  // const { data: profile } = await supabase.from("profiles").update(data).single();
  
  const profile: Profile = {
    name: data.name,
    email: data.email,
    avatarUrl: data.avatarUrl || undefined,
  };
  
  return profile;
}

