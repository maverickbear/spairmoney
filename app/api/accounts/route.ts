import { NextResponse } from "next/server";
import { getAccounts, createAccount } from "@/lib/api/accounts";
import { AccountFormData } from "@/lib/validations/account";

export async function GET() {
  try {
    const accounts = await getAccounts();
    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication and limits
    const { createServerClient } = await import("@/lib/supabase-server");
    const { checkAccountLimit } = await import("@/lib/api/limits");
    
    const supabase = await createServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check account limit
    const limitCheck = await checkAccountLimit(authUser.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message || "Account limit reached" },
        { status: 403 }
      );
    }

    const data = await request.json();
    const account = await createAccount(data as AccountFormData);
    return NextResponse.json(account);
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}

