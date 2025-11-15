#!/usr/bin/env tsx
/**
 * Script to update Stripe Product IDs and Price IDs for production
 * 
 * Usage:
 *   npm run update:stripe-ids
 *   or
 *   tsx scripts/update-stripe-production-ids.ts
 */

import { createServiceRoleClient } from "@/lib/supabase-server";

interface PlanUpdate {
  id: string;
  name: string;
  stripeProductId: string;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
}

const PRODUCTION_STRIPE_IDS: PlanUpdate[] = [
  {
    id: "premium",
    name: "Premium Plan",
    stripeProductId: "prod_TPjK1vCBWIGTa2",
    stripePriceIdMonthly: "price_1SStrqEj1ttZtjC0bOlejqd7",
    stripePriceIdYearly: "price_1SStrqEj1ttZtjC0JY2Il3XQ",
  },
  {
    id: "basic",
    name: "Basic Plan",
    stripeProductId: "prod_TPjKHNbEzYW73x",
    stripePriceIdMonthly: "price_1SStrmEj1ttZtjC0UwcdYRBZ",
    stripePriceIdYearly: "price_1SStrmEj1ttZtjC0UwcdYRBZ", // Note: Same ID for both - verify this is correct
  },
];

async function updateStripeIds() {
  console.log("🔄 Updating Stripe Production IDs...\n");

  const supabase = createServiceRoleClient();

  for (const planUpdate of PRODUCTION_STRIPE_IDS) {
    console.log(`📝 Updating ${planUpdate.name} (${planUpdate.id})...`);

    // First, verify the plan exists
    const { data: existingPlan, error: fetchError } = await supabase
      .from("Plan")
      .select("id, name, stripeProductId, stripePriceIdMonthly, stripePriceIdYearly")
      .eq("id", planUpdate.id)
      .single();

    if (fetchError || !existingPlan) {
      console.error(`❌ Error: Plan ${planUpdate.id} not found`);
      continue;
    }

    console.log(`   Current IDs:`);
    console.log(`   - Product: ${existingPlan.stripeProductId || "null"}`);
    console.log(`   - Monthly Price: ${existingPlan.stripePriceIdMonthly || "null"}`);
    console.log(`   - Yearly Price: ${existingPlan.stripePriceIdYearly || "null"}`);

    // Update the plan
    const { data: updatedPlan, error: updateError } = await supabase
      .from("Plan")
      .update({
        stripeProductId: planUpdate.stripeProductId,
        stripePriceIdMonthly: planUpdate.stripePriceIdMonthly,
        stripePriceIdYearly: planUpdate.stripePriceIdYearly,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", planUpdate.id)
      .select()
      .single();

    if (updateError) {
      console.error(`❌ Error updating ${planUpdate.name}:`, updateError);
      continue;
    }

    console.log(`   New IDs:`);
    console.log(`   - Product: ${updatedPlan.stripeProductId}`);
    console.log(`   - Monthly Price: ${updatedPlan.stripePriceIdMonthly}`);
    console.log(`   - Yearly Price: ${updatedPlan.stripePriceIdYearly}`);
    console.log(`   ✅ ${planUpdate.name} updated successfully!\n`);
  }

  console.log("✨ All plans updated!");

  // Verify all updates
  console.log("\n🔍 Verifying updates...\n");
  const { data: allPlans, error: verifyError } = await supabase
    .from("Plan")
    .select("id, name, stripeProductId, stripePriceIdMonthly, stripePriceIdYearly")
    .in("id", ["basic", "premium"]);

  if (verifyError) {
    console.error("❌ Error verifying updates:", verifyError);
    process.exit(1);
  }

  console.log("Final state:");
  allPlans?.forEach((plan) => {
    console.log(`\n${plan.name} (${plan.id}):`);
    console.log(`  Product ID: ${plan.stripeProductId || "❌ MISSING"}`);
    console.log(`  Monthly Price ID: ${plan.stripePriceIdMonthly || "❌ MISSING"}`);
    console.log(`  Yearly Price ID: ${plan.stripePriceIdYearly || "❌ MISSING"}`);
  });

  console.log("\n✅ Done!");
}

// Run the script
updateStripeIds()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });

