/**
 * Script to update Essential plan features
 * Removes hasAdvancedReports from Essential plan
 */

import { createServiceRoleClient } from "../lib/supabase-server";

async function updateEssentialPlanFeatures() {
  const supabase = createServiceRoleClient();
  
  console.log("🔄 Updating Essential plan features...\n");
  
  // Get current Essential plan
  const { data: plan, error: fetchError } = await supabase
    .from("Plan")
    .select("*")
    .eq("id", "essential")
    .single();
  
  if (fetchError || !plan) {
    console.error("❌ Error fetching Essential plan:", fetchError);
    return;
  }
  
  console.log("📋 Current Essential plan features:");
  const currentFeatures = typeof plan.features === "string" 
    ? JSON.parse(plan.features) 
    : plan.features;
  console.log(JSON.stringify(currentFeatures, null, 2));
  
  // Update features - set hasAdvancedReports to false
  // Also ensure other features match Essential plan requirements
  const updatedFeatures = {
    ...currentFeatures,
    hasAdvancedReports: false,  // Reports não incluído no Essential
    hasInvestments: false,      // Investments não incluído no Essential
    hasHousehold: false,        // Household não incluído no Essential
    hasBudgets: false,          // Budgets não incluído no Essential
    hasCsvImport: false,        // CSV Import não incluído no Essential
    maxTransactions: 300,       // Limite de 300 transações
    maxAccounts: 4,             // Limite de 4 contas
  };
  
  console.log("\n📋 Updated Essential plan features:");
  console.log(JSON.stringify(updatedFeatures, null, 2));
  
  // Update plan
  const { data: updatedPlan, error: updateError } = await supabase
    .from("Plan")
    .update({
      features: updatedFeatures,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", "essential")
    .select()
    .single();
  
  if (updateError) {
    console.error("❌ Error updating plan:", updateError);
    return;
  }
  
  console.log("\n✅ Essential plan updated successfully!");
  console.log("Updated features:", JSON.stringify(updatedPlan.features, null, 2));
  
  // Verify the update
  const { data: verifiedPlan } = await supabase
    .from("Plan")
    .select("*")
    .eq("id", "essential")
    .single();
  
  if (verifiedPlan) {
    const verifiedFeatures = typeof verifiedPlan.features === "string" 
      ? JSON.parse(verifiedPlan.features) 
      : verifiedPlan.features;
    console.log("\n✅ Verification - Current features in database:");
    console.log(JSON.stringify(verifiedFeatures, null, 2));
    console.log(`\n📊 hasAdvancedReports: ${verifiedFeatures.hasAdvancedReports}`);
  }
}

updateEssentialPlanFeatures()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

