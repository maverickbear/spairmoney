import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data (in reverse order of dependencies)
  console.log("Clearing existing data...");
  await supabase.from("SecurityPrice").delete().neq("id", "");
  await supabase.from("InvestmentTransaction").delete().neq("id", "");
  await supabase.from("InvestmentAccount").delete().neq("id", "");
  await supabase.from("Security").delete().neq("id", "");
  await supabase.from("Budget").delete().neq("id", "");
  await supabase.from("Transaction").delete().neq("id", "");
  await supabase.from("Subcategory").delete().neq("id", "");
  await supabase.from("Category").delete().neq("id", "");
  await supabase.from("Group").delete().neq("id", "");
  await supabase.from("Account").delete().neq("id", "");

  // Create Accounts
  console.log("Creating accounts...");
  const { data: accounts, error: accountsError } = await supabase
    .from("Account")
    .insert([
      { name: "Checking", type: "checking" },
      { name: "Credit Card", type: "credit" },
      { name: "Cash", type: "cash" },
      { name: "TFSA", type: "investment" },
      { name: "RRSP", type: "investment" },
      { name: "Crypto Wallet", type: "investment" },
    ])
    .select();

  if (accountsError || !accounts?.length) {
    throw new Error(`Failed to create accounts: ${accountsError?.message}`);
  }

  const [checking, creditCard, cash, tfsa, rrsp, cryptoWallet] = accounts;
  const accountMap: Record<string, string> = {
    checking: checking.id,
    creditCard: creditCard.id,
    cash: cash.id,
    tfsa: tfsa.id,
    rrsp: rrsp.id,
    cryptoWallet: cryptoWallet.id,
  };

  // Create Macros
  console.log("Creating macros and categories...");
  const macros = [
    { name: "Income" },
    { name: "Housing" },
    { name: "Transportation" },
    { name: "Food" },
    { name: "Health" },
    { name: "Subscriptions" },
    { name: "Business" },
    { name: "Family" },
    { name: "Savings" },
    { name: "Investments" },
    { name: "Misc" },
  ];

  const { data: createdMacros, error: macrosError } = await supabase
    .from("Group")
    .insert(macros)
    .select();

  if (macrosError || !createdMacros?.length) {
    throw new Error(`Failed to create macros: ${macrosError?.message}`);
  }

  const macroMap = createdMacros.reduce(
    (acc, macro) => {
      acc[macro.name] = macro.id;
      return acc;
    },
    {} as Record<string, string>
  );

  // Create Categories and Subcategories
  const categoryData = [
    {
      macro: "Housing",
      categories: [
        {
          name: "Rent",
          subcategories: [],
        },
        {
          name: "Utilities",
          subcategories: ["BC Hydro", "Fortis BC", "Internet", "Maintenance", "Insurance"],
        },
      ],
    },
    {
      macro: "Transportation",
      categories: [
        {
          name: "Vehicle",
          subcategories: ["Car Loan", "Car Insurance", "Fuel", "Maintenance", "Parking"],
        },
        {
          name: "Public Transit",
          subcategories: ["Transit Pass"],
        },
      ],
    },
    {
      macro: "Food",
      categories: [
        {
          name: "Groceries",
          subcategories: ["Superstore", "Save-On-Foods", "Costco"],
        },
        {
          name: "Restaurants",
          subcategories: ["Fast Food", "Dine In", "Delivery"],
        },
      ],
    },
    {
      macro: "Health",
      categories: [
        {
          name: "Medical",
          subcategories: ["Doctor", "Dentist", "Pharmacy"],
        },
        {
          name: "Fitness",
          subcategories: ["Gym", "Equipment"],
        },
      ],
    },
    {
      macro: "Subscriptions",
      categories: [
        {
          name: "Streaming",
          subcategories: ["Netflix", "Spotify", "YouTube Premium"],
        },
        {
          name: "Software",
          subcategories: ["Adobe", "Microsoft 365"],
        },
      ],
    },
    {
      macro: "Business",
      categories: [
        {
          name: "Office",
          subcategories: ["Supplies", "Rent"],
        },
        {
          name: "Marketing",
          subcategories: ["Ads", "Tools"],
        },
      ],
    },
    {
      macro: "Family",
      categories: [
        {
          name: "Childcare",
          subcategories: [],
        },
        {
          name: "Education",
          subcategories: [],
        },
      ],
    },
    {
      macro: "Savings",
      categories: [
        {
          name: "Emergency Fund",
          subcategories: [],
        },
      ],
    },
    {
      macro: "Investments",
      categories: [
        {
          name: "Stocks",
          subcategories: [],
        },
        {
          name: "Crypto",
          subcategories: [],
        },
      ],
    },
    {
      macro: "Misc",
      categories: [
        {
          name: "Other",
          subcategories: [],
        },
      ],
    },
  ];

  const categoryMap: Record<string, string> = {};
  const subcategoryMap: Record<string, string> = {};

  for (const macroData of categoryData) {
    const macroId = macroMap[macroData.macro];
    if (!macroId) continue;

    for (const cat of macroData.categories) {
      const { data: category, error: catError } = await supabase
        .from("Category")
        .insert({
          name: cat.name,
          macroId,
        })
        .select()
        .single();

      if (catError || !category) {
        console.error(`Failed to create category ${cat.name}:`, catError);
        continue;
      }

      const fullCategoryName = `${macroData.macro} > ${cat.name}`;
      categoryMap[fullCategoryName] = category.id;

      // Create subcategories
      for (const subcatName of cat.subcategories) {
        const { data: subcategory, error: subcatError } = await supabase
          .from("Subcategory")
          .insert({
            name: subcatName,
            categoryId: category.id,
          })
          .select()
          .single();

        if (subcatError || !subcategory) {
          console.error(`Failed to create subcategory ${subcatName}:`, subcatError);
          continue;
        }

        const fullSubcatName = `${fullCategoryName} > ${subcatName}`;
        subcategoryMap[fullSubcatName] = subcategory.id;
      }
    }
  }

  // Create Investment Accounts
  console.log("Creating investment accounts...");
  const { data: investmentAccounts, error: invAccountsError } = await supabase
    .from("InvestmentAccount")
    .insert([
      { name: "TFSA Investment", type: "tax_free", accountId: accountMap.tfsa },
      { name: "RRSP Investment", type: "retirement", accountId: accountMap.rrsp },
      { name: "Crypto Exchange", type: "crypto", accountId: accountMap.cryptoWallet },
    ])
    .select();

  if (invAccountsError || !investmentAccounts?.length) {
    console.warn(`Failed to create investment accounts: ${invAccountsError?.message}`);
  }

  // Create Securities
  console.log("Creating securities...");
  const { data: securities, error: securitiesError } = await supabase
    .from("Security")
    .insert([
      { symbol: "VTI", name: "Vanguard Total Stock Market ETF", class: "etf" },
      { symbol: "BTC", name: "Bitcoin", class: "crypto" },
      { symbol: "ETH", name: "Ethereum", class: "crypto" },
    ])
    .select();

  if (securitiesError || !securities?.length) {
    console.warn(`Failed to create securities: ${securitiesError?.message}`);
  }

  // Create Sample Transactions
  console.log("Creating sample transactions...");
  const now = new Date();
  const transactions = [];

  // Income transactions
  transactions.push({
    date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    type: "income",
    amount: 5000,
    accountId: accountMap.checking,
    description: "Salary",
  });

  // Expense transactions
  const expenseCategories = [
    { category: "Housing > Rent", amount: 1800 },
    { category: "Housing > Utilities", amount: 150, subcategory: "Housing > Utilities > BC Hydro" },
    { category: "Transportation > Vehicle", amount: 500, subcategory: "Transportation > Vehicle > Fuel" },
    { category: "Food > Groceries", amount: 600 },
    { category: "Food > Restaurants", amount: 200, subcategory: "Food > Restaurants > Delivery" },
    { category: "Subscriptions > Streaming", amount: 30 },
  ];

  for (let i = 0; i < 10; i++) {
    const expense = expenseCategories[i % expenseCategories.length];
    transactions.push({
      date: new Date(now.getFullYear(), now.getMonth(), i + 1).toISOString(),
      type: "expense",
      amount: expense.amount,
      accountId: i % 2 === 0 ? accountMap.checking : accountMap.creditCard,
      categoryId: categoryMap[expense.category],
      subcategoryId: expense.subcategory ? subcategoryMap[expense.subcategory] : null,
      description: `Sample expense ${i + 1}`,
      tags: JSON.stringify([]),
    });
  }

  const { error: transactionsError } = await supabase.from("Transaction").insert(transactions);

  if (transactionsError) {
    console.warn(`Failed to create transactions: ${transactionsError.message}`);
  }

  // Create Budgets
  console.log("Creating budgets...");
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const budgets = [
    { period: currentMonth.toISOString(), categoryId: categoryMap["Housing > Rent"], amount: 1800 },
    { period: currentMonth.toISOString(), categoryId: categoryMap["Housing > Utilities"], amount: 200 },
    { period: currentMonth.toISOString(), categoryId: categoryMap["Food > Groceries"], amount: 600 },
    { period: currentMonth.toISOString(), categoryId: categoryMap["Transportation > Vehicle"], amount: 500 },
  ];

  const { error: budgetsError } = await supabase.from("Budget").insert(budgets);

  if (budgetsError) {
    console.warn(`Failed to create budgets: ${budgetsError.message}`);
  }

  console.log("✅ Seed completed!");
}

main()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  });

