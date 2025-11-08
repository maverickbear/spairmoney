23:52:13.524 Running build in Washington, D.C., USA (East) – iad1
23:52:13.525 Build machine configuration: 2 cores, 8 GB
23:52:13.651 Cloning github.com/naortartarotti/spare-finance (Branch: main, Commit: cd25cb9)
23:52:14.243 Cloning completed: 592.000ms
23:52:14.594 Restored build cache from previous deployment (6xM3behTU3moFzg2iRd5y4erB8Ci)
23:52:15.334 Running "vercel build"
23:52:15.865 Vercel CLI 48.9.0
23:52:16.212 Installing dependencies...
23:52:17.727 
23:52:17.730 added 1 package in 1s
23:52:17.730 
23:52:17.731 163 packages are looking for funding
23:52:17.731   run `npm fund` for details
23:52:17.758 Detected Next.js version: 16.0.1
23:52:17.762 Running "npm run build"
23:52:17.870 
23:52:17.871 > spare-finance@0.1.0 build
23:52:17.871 > next build
23:52:17.871 
23:52:18.906    ▲ Next.js 16.0.1 (Turbopack)
23:52:18.907 
23:52:18.936  ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
23:52:18.978    Creating an optimized production build ...
23:52:46.153  ✓ Compiled successfully in 26.6s
23:52:46.184    Running TypeScript ...
23:53:03.105 Failed to compile.
23:53:03.106 
23:53:03.107 ./components/landing/demo/full-dashboard-demo.tsx:407:38
23:53:03.107 Type error: Type '{ score: number; classification: string; message: string; monthlyIncome: number; monthlyExpenses: number; netAmount: number; savingsRate: number; alerts: { id: string; severity: string; title: string; description: string; }[]; suggestions: { ...; }[]; }' is not assignable to type 'FinancialHealthData'.
23:53:03.107   Types of property 'classification' are incompatible.
23:53:03.107     Type 'string' is not assignable to type '"Excellent" | "Good" | "Fair" | "Poor" | "Critical"'.
23:53:03.107 
23:53:03.108 [0m [90m 405 |[39m             [33m<[39m[33mdiv[39m className[33m=[39m[32m"grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2"[39m style[33m=[39m{{ pointerEvents[33m:[39m [32m"none"[39m }}[33m>[39m
23:53:03.108  [90m 406 |[39m               [33m<[39m[33mIncomeExpensesChart[39m data[33m=[39m{fakeMonthlyData} [33m/[39m[33m>[39m
23:53:03.108 [31m[1m>[22m[39m[90m 407 |[39m               [33m<[39m[33mFinancialHealthWidget[39m data[33m=[39m{fakeFinancialHealth} [33m/[39m[33m>[39m
23:53:03.108  [90m     |[39m                                      [31m[1m^[22m[39m
23:53:03.108  [90m 408 |[39m             [33m<[39m[33m/[39m[33mdiv[39m[33m>[39m
23:53:03.109  [90m 409 |[39m
23:53:03.109  [90m 410 |[39m             {[90m/* Upcoming Transactions and Budget Execution */[39m}[0m
23:53:03.163 Next.js build worker exited with code: 1 and signal: null
23:53:03.196 Error: Command "npm run build" exited with 1