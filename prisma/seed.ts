import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  await prisma.securityPrice.deleteMany();
  await prisma.investmentTransaction.deleteMany();
  await prisma.investmentAccount.deleteMany();
  await prisma.security.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.macro.deleteMany();
  await prisma.account.deleteMany();

  // Create Accounts
  console.log("Creating accounts...");
  const checking = await prisma.account.create({
    data: { name: "Checking", type: "checking" },
  });
  const creditCard = await prisma.account.create({
    data: { name: "Credit Card", type: "credit" },
  });
  const cash = await prisma.account.create({
    data: { name: "Cash", type: "cash" },
  });
  const tfsa = await prisma.account.create({
    data: { name: "TFSA", type: "investment" },
  });
  const rrsp = await prisma.account.create({
    data: { name: "RRSP", type: "investment" },
  });
  const cryptoWallet = await prisma.account.create({
    data: { name: "Crypto Wallet", type: "investment" },
  });

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

  const createdMacros = await Promise.all(
    macros.map((macro) => prisma.macro.create({ data: macro }))
  );

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
          subcategories: [],
        },
        {
          name: "Restaurants",
          subcategories: [],
        },
        {
          name: "Coffee",
          subcategories: [],
        },
        {
          name: "Pet Food",
          subcategories: ["Apollo"],
        },
      ],
    },
    {
      macro: "Health",
      categories: [
        {
          name: "Therapy",
          subcategories: ["Naor", "Natalia"],
        },
        {
          name: "Medication",
          subcategories: ["Ozempic"],
        },
        {
          name: "Gym",
          subcategories: [],
        },
        {
          name: "Insurance",
          subcategories: [],
        },
      ],
    },
    {
      macro: "Subscriptions",
      categories: [
        {
          name: "Streaming",
          subcategories: ["Netflix", "Disney+", "YouTube"],
        },
        {
          name: "Software",
          subcategories: ["Spotify", "Adobe", "ChatGPT", "Cloud"],
        },
      ],
    },
    {
      macro: "Business",
      categories: [
        {
          name: "Office",
          subcategories: ["Office Rent (70%)", "Phone & Internet", "Equipment", "Hosting", "Accounting"],
        },
      ],
    },
    {
      macro: "Family",
      categories: [
        {
          name: "Gifts",
          subcategories: [],
        },
        {
          name: "Child/Baby",
          subcategories: [],
        },
        {
          name: "Education",
          subcategories: [],
        },
        {
          name: "Travel",
          subcategories: [],
        },
        {
          name: "Donations",
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
        {
          name: "RRSP",
          subcategories: [],
        },
        {
          name: "FHSA",
          subcategories: [],
        },
        {
          name: "TFSA",
          subcategories: [],
        },
      ],
    },
    {
      macro: "Misc",
      categories: [
        {
          name: "Bank Fees",
          subcategories: [],
        },
        {
          name: "Overdraft",
          subcategories: [],
        },
        {
          name: "Unexpected",
          subcategories: [],
        },
        {
          name: "Uncategorized",
          subcategories: [],
        },
      ],
    },
  ];

  const categoryMap: Record<string, string> = {};
  const subcategoryMap: Record<string, string> = {};

  for (const { macro, categories } of categoryData) {
    for (const catData of categories) {
      const category = await prisma.category.create({
        data: {
          name: catData.name,
          macroId: macroMap[macro],
        },
      });
      categoryMap[`${macro}-${catData.name}`] = category.id;

      for (const subcatName of catData.subcategories) {
        const subcategory = await prisma.subcategory.create({
          data: {
            name: subcatName,
            categoryId: category.id,
          },
        });
        subcategoryMap[`${catData.name}-${subcatName}`] = subcategory.id;
      }
    }
  }

  // Create Income category
  const incomeCategory = await prisma.category.create({
    data: {
      name: "Salary",
      macroId: macroMap["Income"],
    },
  });
  categoryMap["Income-Salary"] = incomeCategory.id;

  // Create sample budgets for current month
  console.log("Creating budgets...");
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const budgets = [
    { category: "Housing-Utilities", amount: 500 },
    { category: "Transportation-Vehicle", amount: 800 },
    { category: "Food-Groceries", amount: 600 },
    { category: "Food-Restaurants", amount: 300 },
    { category: "Health-Therapy", amount: 400 },
    { category: "Subscriptions-Streaming", amount: 50 },
    { category: "Business-Office", amount: 1200 },
    { category: "Family-Travel", amount: 1000 },
  ];

  for (const budget of budgets) {
    const categoryId = categoryMap[budget.category];
    if (categoryId) {
      await prisma.budget.create({
        data: {
          period: currentMonth,
          categoryId,
          amount: budget.amount,
        },
      });
    }
  }

  // Create sample transactions (2-3 months)
  console.log("Creating transactions...");
  const transactions = [];
  const monthsBack = 2;

  for (let monthOffset = 0; monthOffset <= monthsBack; monthOffset++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    
    // Income transactions
    transactions.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
      type: "income",
      amount: 5000,
      accountId: checking.id,
      categoryId: categoryMap["Income-Salary"],
      description: "Salary",
    });

    // Housing expenses
    transactions.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
      type: "expense",
      amount: 2200,
      accountId: checking.id,
      categoryId: categoryMap["Housing-Rent"],
      description: "Rent",
    });

    transactions.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15),
      type: "expense",
      amount: 150,
      accountId: checking.id,
      categoryId: categoryMap["Housing-Utilities"],
      subcategoryId: subcategoryMap["Utilities-BC Hydro"],
      description: "BC Hydro bill",
    });

    transactions.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 20),
      type: "expense",
      amount: 80,
      accountId: checking.id,
      categoryId: categoryMap["Housing-Utilities"],
      subcategoryId: subcategoryMap["Utilities-Internet"],
      description: "Internet",
    });

    // Food expenses
    for (let i = 0; i < 4; i++) {
      transactions.push({
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5 + i * 7),
        type: "expense",
        amount: 150,
        accountId: checking.id,
        categoryId: categoryMap["Food-Groceries"],
        description: "Groceries",
      });
    }

    for (let i = 0; i < 8; i++) {
      transactions.push({
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 3 + i * 4),
        type: "expense",
        amount: 25 + Math.random() * 50,
        accountId: creditCard.id,
        categoryId: categoryMap["Food-Restaurants"],
        description: "Restaurant",
      });
    }

    // Health expenses
    transactions.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10),
      type: "expense",
      amount: 200,
      accountId: checking.id,
      categoryId: categoryMap["Health-Therapy"],
      subcategoryId: subcategoryMap["Therapy-Naor"],
      description: "Therapy session",
    });

    transactions.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 25),
      type: "expense",
      amount: 150,
      accountId: creditCard.id,
      categoryId: categoryMap["Health-Medication"],
      subcategoryId: subcategoryMap["Medication-Ozempic"],
      description: "Ozempic",
    });

    // Subscriptions
    transactions.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
      type: "expense",
      amount: 15.99,
      accountId: creditCard.id,
      categoryId: categoryMap["Subscriptions-Streaming"],
      subcategoryId: subcategoryMap["Streaming-Netflix"],
      description: "Netflix",
    });

    transactions.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
      type: "expense",
      amount: 20,
      accountId: creditCard.id,
      categoryId: categoryMap["Subscriptions-Software"],
      subcategoryId: subcategoryMap["Software-Spotify"],
      description: "Spotify",
    });

    // Business expenses
    transactions.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
      type: "expense",
      amount: 840,
      accountId: checking.id,
      categoryId: categoryMap["Business-Office"],
      subcategoryId: subcategoryMap["Office-Office Rent (70%)"],
      description: "Office rent",
    });

    // Transfer from checking to savings
    const transferAmount = 500;
    const transferFrom = await prisma.transaction.create({
      data: {
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 28),
        type: "transfer",
        amount: transferAmount,
        accountId: checking.id,
        description: "Transfer to savings",
        transferToId: tfsa.id,
      },
    });

    await prisma.transaction.create({
      data: {
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 28),
        type: "transfer",
        amount: transferAmount,
        accountId: tfsa.id,
        description: "Transfer from checking",
        transferFromId: transferFrom.id,
      },
    });
  }

  await prisma.transaction.createMany({
    data: transactions,
  });

  // Create Investment Accounts
  console.log("Creating investment accounts...");
  const investmentTfsa = await prisma.investmentAccount.create({
    data: {
      name: "TFSA",
      type: "TFSA",
      accountId: tfsa.id,
    },
  });

  const investmentCrypto = await prisma.investmentAccount.create({
    data: {
      name: "Crypto Wallet",
      type: "Crypto Wallet",
      accountId: cryptoWallet.id,
    },
  });

  // Create Securities
  console.log("Creating securities...");
  const vfv = await prisma.security.create({
    data: {
      symbol: "VFV",
      name: "Vanguard S&P 500 Index ETF",
      class: "etf",
    },
  });

  const btc = await prisma.security.create({
    data: {
      symbol: "BTC",
      name: "Bitcoin",
      class: "crypto",
    },
  });

  const shop = await prisma.security.create({
    data: {
      symbol: "SHOP",
      name: "Shopify Inc.",
      class: "stock",
    },
  });

  // Create Investment Transactions
  console.log("Creating investment transactions...");
  const investmentTxs = [
    {
      date: new Date(now.getFullYear(), now.getMonth() - 2, 5),
      accountId: investmentTfsa.id,
      securityId: vfv.id,
      type: "buy",
      quantity: 10,
      price: 90.5,
      fees: 9.95,
      notes: "Initial purchase",
    },
    {
      date: new Date(now.getFullYear(), now.getMonth() - 1, 10),
      accountId: investmentTfsa.id,
      securityId: vfv.id,
      type: "buy",
      quantity: 5,
      price: 92.3,
      fees: 9.95,
      notes: "Additional purchase",
    },
    {
      date: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      accountId: investmentTfsa.id,
      securityId: shop.id,
      type: "buy",
      quantity: 8,
      price: 85.2,
      fees: 9.95,
      notes: "Shopify purchase",
    },
    {
      date: new Date(now.getFullYear(), now.getMonth() - 1, 20),
      accountId: investmentTfsa.id,
      securityId: vfv.id,
      type: "dividend",
      quantity: null,
      price: null,
      fees: 0,
      notes: "Dividend payment",
    },
    {
      date: new Date(now.getFullYear(), now.getMonth() - 2, 12),
      accountId: investmentCrypto.id,
      securityId: btc.id,
      type: "buy",
      quantity: 0.5,
      price: 65000,
      fees: 25,
      notes: "Bitcoin purchase",
    },
    {
      date: new Date(now.getFullYear(), now.getMonth() - 1, 8),
      accountId: investmentCrypto.id,
      securityId: btc.id,
      type: "buy",
      quantity: 0.3,
      price: 68000,
      fees: 20,
      notes: "Additional Bitcoin",
    },
  ];

  await prisma.investmentTransaction.createMany({
    data: investmentTxs,
  });

  // Create Security Prices
  console.log("Creating security prices...");
  await prisma.securityPrice.createMany({
    data: [
      {
        securityId: vfv.id,
        date: new Date(now.getFullYear(), now.getMonth(), 1),
        price: 94.5,
      },
      {
        securityId: shop.id,
        date: new Date(now.getFullYear(), now.getMonth(), 1),
        price: 88.7,
      },
      {
        securityId: btc.id,
        date: new Date(now.getFullYear(), now.getMonth(), 1),
        price: 72000,
      },
    ],
  });

  console.log("✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

