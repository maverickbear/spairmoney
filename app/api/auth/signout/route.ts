import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/lib/api/auth";

export async function POST(request: NextRequest) {
  try {
    const { error } = await signOut();
    
    // Create response
    const response = NextResponse.json({ success: true });
    
    // Clear cookies
    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");
    
    if (error) {
      console.error("Error in sign out:", error);
      // Still clear cookies even if there's an error
      return response;
    }
    
    return response;
  } catch (error) {
    console.error("Error in sign out:", error);
    
    // Create response with error
    const response = NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
    
    // Clear cookies even on error
    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");
    
    return response;
  }
}

