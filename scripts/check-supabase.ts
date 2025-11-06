#!/usr/bin/env tsx
/**
 * Script to check Supabase configuration and connectivity
 * Run with: npx tsx scripts/check-supabase.ts
 */

import { validateSupabaseConfig } from "../lib/utils/supabase-error";

async function checkSupabase() {
  console.log("🔍 Checking Supabase configuration...\n");

  // Check environment variables
  const configCheck = validateSupabaseConfig();
  if (!configCheck.isValid) {
    console.error("❌ Configuration Error:", configCheck.error);
    console.log("\n💡 Please check your .env.local file:");
    console.log("   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co");
    console.log("   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key\n");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  console.log("✅ Environment variables found");
  console.log(`   URL: ${url}\n`);

  // Try to connect to Supabase
  console.log("🔌 Testing Supabase connectivity...\n");
  
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    });

    if (response.status === 404) {
      console.error("❌ Supabase project not found (404)");
      console.log("\n💡 Possible issues:");
      console.log("   1. The Supabase project may have been deleted or paused");
      console.log("   2. The URL in your .env.local might be incorrect");
      console.log("   3. Check your Supabase dashboard: https://supabase.com/dashboard");
      console.log("\n   Current URL:", url);
      process.exit(1);
    } else if (response.status === 401) {
      console.warn("⚠️  Authentication error (401)");
      console.log("   This might be normal if the endpoint requires authentication");
      console.log("   The Supabase URL appears to be valid.\n");
    } else if (response.ok || response.status < 500) {
      console.log("✅ Supabase is accessible!");
      console.log(`   Status: ${response.status}\n`);
    } else {
      console.warn(`⚠️  Unexpected response: ${response.status}`);
      console.log("   The Supabase URL might be valid, but there's an issue\n");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("getaddrinfo")) {
      console.error("❌ DNS resolution failed");
      console.log("\n💡 The Supabase hostname cannot be resolved.");
      console.log("   Possible issues:");
      console.log("   1. The Supabase project URL is incorrect");
      console.log("   2. Network connectivity issues");
      console.log("   3. The project might have been deleted\n");
      console.log("   Error:", errorMessage);
      console.log("   Current URL:", url);
    } else if (errorMessage.includes("ECONNREFUSED")) {
      console.error("❌ Connection refused");
      console.log("\n💡 The Supabase server is not accepting connections.");
      console.log("   The project might be paused or unavailable.\n");
    } else {
      console.error("❌ Connection error:", errorMessage);
      console.log("\n   Current URL:", url);
    }
    process.exit(1);
  }

  console.log("✅ All checks passed!\n");
}

checkSupabase().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

