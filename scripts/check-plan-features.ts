import { createServiceRoleClient } from "../lib/supabase-server";

async function checkPlanFeatures() {
  const supabase = createServiceRoleClient();
  
  console.log("🔍 Checking plan features...\n");
  
  const { data: plans, error } = await supabase
    .from("Plan")
    .select("*")
    .in("id", ["essential", "pro"]);
  
  if (error) {
    console.error("❌ Error fetching plans:", error);
    return;
  }
  
  if (!plans || plans.length === 0) {
    console.error("❌ No plans found");
    return;
  }
  
  for (const plan of plans) {
    console.log(`\n📋 Plan: ${plan.name} (${plan.id})`);
    console.log("Current features:");
    
    const features = typeof plan.features === "string" 
      ? JSON.parse(plan.features) 
      : plan.features;
    
    console.log(JSON.stringify(features, null, 2));
    
    // Check if it's correct
    if (plan.id === "pro") {
      const issues: string[] = [];
      if (features.hasInvestments !== true) {
        issues.push("hasInvestments should be true");
      }
      if (features.hasHousehold !== true) {
        issues.push("hasHousehold should be true");
      }
      if (features.hasAdvancedReports !== true) {
        issues.push("hasAdvancedReports should be true");
      }
      if (features.hasCsvExport !== true) {
        issues.push("hasCsvExport should be true");
      }
      if (features.hasBankIntegration !== true) {
        issues.push("hasBankIntegration should be true");
      }
      if (features.maxTransactions !== -1) {
        issues.push("maxTransactions should be -1 (unlimited)");
      }
      if (features.maxAccounts !== -1) {
        issues.push("maxAccounts should be -1 (unlimited)");
      }
      
      if (issues.length > 0) {
        console.log("\n⚠️  Issues found:");
        issues.forEach(issue => console.log(`  - ${issue}`));
      } else {
        console.log("\n✅ Pro plan is correct!");
      }
    } else if (plan.id === "essential") {
      const issues: string[] = [];
      if (features.hasInvestments !== true) {
        issues.push("hasInvestments should be true");
      }
      if (features.hasHousehold !== true) {
        issues.push("hasHousehold should be true (according to FAQ, Basic includes household)");
      }
      if (features.hasAdvancedReports !== true) {
        issues.push("hasAdvancedReports should be true");
      }
      if (features.hasCsvExport !== true) {
        issues.push("hasCsvExport should be true");
      }
      if (features.hasBankIntegration !== true) {
        issues.push("hasBankIntegration should be true");
      }
      if (features.maxTransactions !== 500) {
        issues.push("maxTransactions should be 500");
      }
      if (features.maxAccounts !== 10) {
        issues.push("maxAccounts should be 10");
      }
      
      if (issues.length > 0) {
        console.log("\n⚠️  Issues found:");
        issues.forEach(issue => console.log(`  - ${issue}`));
      } else {
        console.log("\n✅ Essential plan is correct!");
      }
    }
  }
}

checkPlanFeatures().catch(console.error);
