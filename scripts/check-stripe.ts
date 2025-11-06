#!/usr/bin/env tsx
/**
 * Script to check Stripe configuration and verify integration
 * Run with: npx tsx scripts/check-stripe.ts
 */

// Load environment variables from .env.local
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client directly (avoiding supabase-server.ts module-level checks)
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

interface CheckResult {
  isValid: boolean;
  error?: string;
  details?: string[];
}

async function checkStripeConfig(): Promise<CheckResult> {
  const errors: string[] = [];
  const details: string[] = [];

  // Check environment variables
  console.log("🔍 Checking Stripe environment variables...\n");

  if (!process.env.STRIPE_SECRET_KEY) {
    errors.push("STRIPE_SECRET_KEY is not set");
  } else {
    if (!process.env.STRIPE_SECRET_KEY.startsWith("sk_test_") && !process.env.STRIPE_SECRET_KEY.startsWith("sk_live_")) {
      errors.push("STRIPE_SECRET_KEY format is invalid (should start with sk_test_ or sk_live_)");
    } else {
      details.push(`✅ STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY.substring(0, 12)}...`);
    }
  }

  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    errors.push("STRIPE_PUBLISHABLE_KEY is not set");
  } else {
    if (!process.env.STRIPE_PUBLISHABLE_KEY.startsWith("pk_test_") && !process.env.STRIPE_PUBLISHABLE_KEY.startsWith("pk_live_")) {
      errors.push("STRIPE_PUBLISHABLE_KEY format is invalid (should start with pk_test_ or pk_live_)");
    } else {
      details.push(`✅ STRIPE_PUBLISHABLE_KEY: ${process.env.STRIPE_PUBLISHABLE_KEY.substring(0, 12)}...`);
    }
  }

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    errors.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
  } else {
    if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY !== process.env.STRIPE_PUBLISHABLE_KEY) {
      errors.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY should match STRIPE_PUBLISHABLE_KEY");
    } else {
      details.push(`✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: configured`);
    }
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    details.push("⚠️  STRIPE_WEBHOOK_SECRET is not set (optional for local testing with Stripe CLI)");
  } else {
    if (!process.env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_")) {
      errors.push("STRIPE_WEBHOOK_SECRET format is invalid (should start with whsec_)");
    } else {
      details.push(`✅ STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 12)}...`);
    }
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    details.push("⚠️  NEXT_PUBLIC_APP_URL is not set (defaults to http://localhost:3000)");
  } else {
    details.push(`✅ NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL}`);
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      error: errors.join(", "),
      details,
    };
  }

  return {
    isValid: true,
    details,
  };
}

async function checkStripeConnection(): Promise<CheckResult> {
  console.log("\n🔌 Testing Stripe API connection...\n");

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-10-29.clover",
      typescript: true,
    });

    // Test connection by listing products
    const products = await stripe.products.list({ limit: 10 });

    console.log(`✅ Stripe connection successful!`);
    console.log(`   Found ${products.data.length} product(s) in your Stripe account\n`);

    return {
      isValid: true,
      details: [`Found ${products.data.length} product(s)`],
    };
  } catch (error: any) {
    const errorMessage = error?.message || String(error);

    if (errorMessage.includes("Invalid API Key")) {
      return {
        isValid: false,
        error: "Invalid Stripe API key. Please check your STRIPE_SECRET_KEY.",
      };
    } else if (errorMessage.includes("No such API version")) {
      return {
        isValid: false,
        error: "Stripe API version mismatch. Please update the Stripe package.",
      };
    } else {
      return {
        isValid: false,
        error: `Stripe API error: ${errorMessage}`,
      };
    }
  }
}

async function checkDatabasePlans(): Promise<CheckResult> {
  console.log("\n📊 Checking plans in database...\n");

  try {
    const supabase = createSupabaseClient();

    const { data: plans, error } = await supabase.from("Plan").select("*").in("id", ["basic", "premium"]);

    if (error) {
      return {
        isValid: false,
        error: `Database error: ${error.message}`,
      };
    }

    if (!plans || plans.length === 0) {
      return {
        isValid: false,
        error: "No plans found in database. Please run the seed migration.",
      };
    }

    const details: string[] = [];
    const errors: string[] = [];

    for (const plan of plans) {
      console.log(`   Checking ${plan.id} plan...`);

      if (!plan.stripeProductId) {
        errors.push(`${plan.id}: stripeProductId is missing`);
      } else {
        details.push(`   ✅ ${plan.id}: Product ID = ${plan.stripeProductId}`);
      }

      if (!plan.stripePriceIdMonthly) {
        errors.push(`${plan.id}: stripePriceIdMonthly is missing`);
      } else {
        details.push(`   ✅ ${plan.id}: Monthly Price ID = ${plan.stripePriceIdMonthly}`);
      }

      if (!plan.stripePriceIdYearly) {
        errors.push(`${plan.id}: stripePriceIdYearly is missing`);
      } else {
        details.push(`   ✅ ${plan.id}: Yearly Price ID = ${plan.stripePriceIdYearly}`);
      }
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        error: errors.join(", "),
        details,
      };
    }

    return {
      isValid: true,
      details,
    };
  } catch (error: any) {
    return {
      isValid: false,
      error: `Error checking database: ${error?.message || String(error)}`,
    };
  }
}

async function verifyStripeProducts(): Promise<CheckResult> {
  console.log("\n🔐 Verifying Stripe products and prices...\n");

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-10-29.clover",
      typescript: true,
    });

    const supabase = createSupabaseClient();
    const { data: plans, error } = await supabase.from("Plan").select("*").in("id", ["basic", "premium"]);

    if (error || !plans) {
      return {
        isValid: false,
        error: "Failed to fetch plans from database",
      };
    }

    const details: string[] = [];
    const errors: string[] = [];

    for (const plan of plans) {
      console.log(`   Verifying ${plan.id} plan...`);

      // Verify product exists
      if (plan.stripeProductId) {
        try {
          const product = await stripe.products.retrieve(plan.stripeProductId);
          details.push(`   ✅ ${plan.id}: Product "${product.name}" exists`);
        } catch (error: any) {
          errors.push(`${plan.id}: Product ${plan.stripeProductId} not found in Stripe`);
        }
      }

      // Verify monthly price exists
      if (plan.stripePriceIdMonthly) {
        try {
          const price = await stripe.prices.retrieve(plan.stripePriceIdMonthly);
          details.push(`   ✅ ${plan.id}: Monthly price $${(price.unit_amount || 0) / 100} exists`);
        } catch (error: any) {
          errors.push(`${plan.id}: Monthly price ${plan.stripePriceIdMonthly} not found in Stripe`);
        }
      }

      // Verify yearly price exists
      if (plan.stripePriceIdYearly) {
        try {
          const price = await stripe.prices.retrieve(plan.stripePriceIdYearly);
          details.push(`   ✅ ${plan.id}: Yearly price $${(price.unit_amount || 0) / 100} exists`);
        } catch (error: any) {
          errors.push(`${plan.id}: Yearly price ${plan.stripePriceIdYearly} not found in Stripe`);
        }
      }
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        error: errors.join(", "),
        details,
      };
    }

    return {
      isValid: true,
      details,
    };
  } catch (error: any) {
    return {
      isValid: false,
      error: `Error verifying Stripe products: ${error?.message || String(error)}`,
    };
  }
}

async function checkStripe() {
  console.log("🔍 Checking Stripe configuration...\n");

  // Check environment variables
  const configCheck = await checkStripeConfig();
  if (!configCheck.isValid) {
    console.error("❌ Configuration Error:", configCheck.error);
    if (configCheck.details) {
      console.log("\nDetails:");
      configCheck.details.forEach((detail) => console.log(`   ${detail}`));
    }
    console.log("\n💡 Please check your .env.local file:");
    console.log("   STRIPE_SECRET_KEY=sk_test_...");
    console.log("   STRIPE_PUBLISHABLE_KEY=pk_test_...");
    console.log("   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...");
    console.log("   STRIPE_WEBHOOK_SECRET=whsec_... (optional for local testing)\n");
    process.exit(1);
  }

  if (configCheck.details) {
    configCheck.details.forEach((detail) => console.log(`   ${detail}`));
  }

  // Check Stripe connection
  const connectionCheck = await checkStripeConnection();
  if (!connectionCheck.isValid) {
    console.error("\n❌ Stripe Connection Error:", connectionCheck.error);
    console.log("\n💡 Possible issues:");
    console.log("   1. Invalid API key - check your STRIPE_SECRET_KEY");
    console.log("   2. Network connectivity issues");
    console.log("   3. Stripe API might be temporarily unavailable\n");
    process.exit(1);
  }

  // Check database plans
  const dbCheck = await checkDatabasePlans();
  if (!dbCheck.isValid) {
    console.error("\n❌ Database Check Error:", dbCheck.error);
    if (dbCheck.details) {
      console.log("\nDetails:");
      dbCheck.details.forEach((detail) => console.log(`   ${detail}`));
    }
    console.log("\n💡 Please run the migration:");
    console.log("   supabase/migrations/20241115000001_update_stripe_ids.sql");
    console.log("   in your Supabase SQL Editor\n");
    process.exit(1);
  }

  // Verify Stripe products
  const verifyCheck = await verifyStripeProducts();
  if (!verifyCheck.isValid) {
    console.error("\n❌ Stripe Verification Error:", verifyCheck.error);
    if (verifyCheck.details) {
      console.log("\nDetails:");
      verifyCheck.details.forEach((detail) => console.log(`   ${detail}`));
    }
    console.log("\n💡 Please verify:");
    console.log("   1. Products and prices exist in Stripe Dashboard");
    console.log("   2. IDs in database match the IDs in Stripe\n");
    process.exit(1);
  }

  console.log("\n✅ All Stripe checks passed!\n");
  console.log("🎉 Your Stripe integration is configured correctly!\n");
  console.log("📝 Next steps:");
  console.log("   1. Start your dev server: npm run dev");
  console.log("   2. Set up webhook for local testing (optional):");
  console.log("      stripe listen --forward-to localhost:3000/api/stripe/webhook");
  console.log("   3. Test checkout at /pricing or /select-plan\n");
}

checkStripe().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

