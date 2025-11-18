import { createServiceRoleClient } from "../lib/supabase-server";

async function diagnoseSubscription() {
  const supabase = createServiceRoleClient();
  
  console.log("🔍 Diagnosing subscription...\n");
  
  // First, let's see what subscriptions exist
  const { data: allSubscriptions, error: allError } = await supabase
    .from("Subscription")
    .select("*")
    .order("createdAt", { ascending: false });
  
  if (allError) {
    console.error("❌ Error fetching subscriptions:", allError);
    return;
  }
  
  console.log(`\n📊 Total subscriptions found: ${allSubscriptions?.length || 0}\n`);
  
  if (allSubscriptions && allSubscriptions.length > 0) {
    for (const sub of allSubscriptions) {
      console.log(`\n📋 Subscription ID: ${sub.id}`);
      console.log(`   User ID: ${sub.userId}`);
      console.log(`   Plan ID: ${sub.planId}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Created: ${sub.createdAt}`);
      console.log(`   Updated: ${sub.updatedAt}`);
      
      // Check if plan exists
      const { data: plan, error: planError } = await supabase
        .from("Plan")
        .select("*")
        .eq("id", sub.planId)
        .single();
      
      if (planError) {
        console.log(`   ⚠️  Plan ${sub.planId} not found!`);
      } else {
        console.log(`   ✅ Plan found: ${plan.name}`);
        const features = typeof plan.features === "string" 
          ? JSON.parse(plan.features) 
          : plan.features;
        console.log(`   Features:`);
        console.log(`     - hasInvestments: ${features.hasInvestments}`);
        console.log(`     - hasHousehold: ${features.hasHousehold}`);
        console.log(`     - hasAdvancedReports: ${features.hasAdvancedReports}`);
        console.log(`     - maxTransactions: ${features.maxTransactions}`);
        console.log(`     - maxAccounts: ${features.maxAccounts}`);
      }
      
      // Check user
      const { data: user, error: userError } = await supabase
        .from("User")
        .select("id, email, name")
        .eq("id", sub.userId)
        .single();
      
      if (userError) {
        console.log(`   ⚠️  User ${sub.userId} not found!`);
      } else {
        console.log(`   ✅ User: ${user.email} (${user.name || 'no name'})`);
      }
    }
  } else {
    console.log("⚠️  No subscriptions found in database!");
  }
  
  // Check plans
  console.log("\n\n📦 Checking plans...\n");
  const { data: plans, error: plansError } = await supabase
    .from("Plan")
    .select("*")
    .in("id", ["essential", "pro"]);
  
  if (plansError) {
    console.error("❌ Error fetching plans:", plansError);
  } else if (plans && plans.length > 0) {
    for (const plan of plans) {
      console.log(`\n📋 Plan: ${plan.name} (${plan.id})`);
      const features = typeof plan.features === "string" 
        ? JSON.parse(plan.features) 
        : plan.features;
      console.log(JSON.stringify(features, null, 2));
    }
  } else {
    console.log("⚠️  No plans found!");
  }
}

diagnoseSubscription().catch(console.error);

