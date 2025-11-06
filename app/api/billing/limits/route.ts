import { NextResponse } from "next/server";
import { checkTransactionLimit, checkAccountLimit } from "@/lib/api/limits";
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

    const transactionLimit = await checkTransactionLimit(authUser.id);
    const accountLimit = await checkAccountLimit(authUser.id);

    return NextResponse.json({
      transactionLimit,
      accountLimit,
    });
  } catch (error) {
    console.error("Error fetching limits:", error);
    return NextResponse.json(
      { error: "Failed to fetch limits" },
      { status: 500 }
    );
  }
}

