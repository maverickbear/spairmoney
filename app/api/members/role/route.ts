import { NextResponse } from "next/server";
import { getUserRole } from "@/lib/api/members";
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

    // Get user's role from User table
    const { data: user } = await supabase
      .from("User")
      .select("role")
      .eq("id", authUser.id)
      .single();

    // Return role from User table, default to admin if not set
    const role = (user?.role as "admin" | "member") || "admin";
    return NextResponse.json({ role });
  } catch (error) {
    console.error("Error fetching user role:", error);
    // Default to admin if error (user likely owns the account)
    return NextResponse.json({ role: "admin" });
  }
}

