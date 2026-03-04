# Insights (Spair Score)

## Purpose

Surfaces a **financial panorama** and actionable insights for the current month: an AI-generated narrative (via OpenAI) plus key numbers, Spair Score, and insight blocks (spending, debt, security, habits). The page helps users see what is affecting their financial quality of life and what they can do about it. When OpenAI is unavailable or fails, the page falls back to rule-based alerts and financial-health suggestions.

## User Flows

- Open Insights page (/insights). It appears in the main menu after Dashboard (Overview section).
- View the hero panorama (2–4 sentences) summarizing the month.
- See key numbers: income, expenses, savings rate, debt load, emergency fund months.
- View Spair Score and metrics (spending discipline, debt exposure, emergency fund).
- Read insight blocks grouped by category (Spending, Debt, Security, Habits), each with title, description, and “What you can do.”
- Month is the current month by default; the client requests insights for that month via the API.

## Behavior / Logic

- **Panorama and insight items:** Built from anonymized financial context (income, expenses, top categories, debts, subscriptions, emergency fund, Spair Score, budget over/under, existing alerts). The context is sent to OpenAI (gpt-4o-mini); the model returns a `panorama` string and an array of `insightItems` (id, title, description, action, priority, category). Response is validated with Zod (`src/domain/insights/validations.ts`).
- **Spair Score:** Same as before: computed from transactions and user/household data using `spair-score-calculator` and `financial-health`. Shown in its own card after the key numbers.
- **Data:** The page loads dashboard data (including secondary: debts, subscriptions) and passes it to the client. The client fetches GET `/api/v2/insights?month=YYYY-MM`, which builds context from transactions, debts, financial health, subscriptions, and budgets, then calls the insights service to generate AI insights. No PII is sent to OpenAI; only aggregated numbers and category/debt-type labels.
- **Fallback:** If the API returns `fallback: true` (e.g. OpenAI unavailable or error), or if there are no AI insight items, the UI shows the existing rule-based alerts (savings rate, emergency fund, overspending, financial-health alerts) and suggestions.
- **Caching:** The API response is sent with `Cache-Control: private, max-age=86400` (24 hours) so the client can cache per user and avoid repeated OpenAI calls for the same month.

## Key Routes / Pages

- `app/(protected)/insights/page.tsx` – Server component; loads dashboard data and `loadSecondaryDashboardData` (debts, subscriptions), then renders `SpairScoreInsightsPage` with financial health, transactions, debts, subscriptions, budgets.
- `app/(protected)/insights/insights-content.tsx` – Client component; fetches GET `/api/v2/insights`, renders panorama hero, key numbers, Spair Score card, AI insight blocks (or fallback alerts/suggestions).
- `src/application/shared/financial-health.ts` – Spair Score and financial health.
- `src/application/shared/spair-score-calculator.ts` – Score calculation.

## API

- **GET /api/v2/insights?month=YYYY-MM** (optional; defaults to current month). Auth required (`getCurrentUserId()`).
- Builds context from: current- and last-month transactions, debts, financial health, subscriptions, budgets. Calls `InsightsService.buildContext()` and `InsightsService.generateInsights(context, locale)`.
- Returns JSON: `{ panorama, insightItems, fallback, context? }`. When AI succeeds: `panorama` (string), `insightItems` (array of { id, title, description, action, priority, category }), `fallback: false`, and optional `context` (income, expenses, savingsRatePercent, emergencyFundMonths, spairScore, etc.). When AI is skipped or fails: `panorama: null`, `insightItems: []`, `fallback: true`, and `context` with the same key numbers for display.
- Response cached with `Cache-Control: private, max-age=86400`.

## Context Shape (sent to OpenAI, no PII)

- `monthLabel`, `income`, `expenses`, `netAmount`, `savingsRatePercent`
- `topCategories`: array of `{ name, amount, percentOfExpenses, trendVsLastMonthPercent }`
- `debtSummary`: `totalBalance`, `totalMonthlyPayment`, `debtToIncomePercent`, `hasHighInterestDebt`, `debtCount`, `types`
- `subscriptionsTotalMonthly`, `emergencyFundMonths`, `spairScore`, `spendingDiscipline`, `debtExposure`
- `budgetOverUnder`: array of `{ categoryName, budgeted, actual, overBy }`
- `existingAlerts`: array of `{ title, description, severity }`
- `expenseTrendVsLastMonthPercent`

## Domain / Application

- **Domain:** `src/domain/insights/` – `types.ts` (InsightContext, InsightItem, InsightsPanorama), `validations.ts` (Zod schemas for API and OpenAI response).
- **Application:** `src/application/insights/insights.service.ts` (buildContextFromData, generateInsightsWithOpenAI), `insights.factory.ts` (makeInsightsService). Service uses OpenAI gpt-4o-mini with `response_format: { type: "json_object" }`.
- **Application (shared):** `financial-health.ts`, `spair-score-calculator.ts` for Spair Score and alerts.

## Infrastructure

- No dedicated insights table. OpenAI is called from the application layer (env: `OPENAI_API_KEY`). Transactions, debts, budgets, subscriptions come from existing repositories and services.

## Dependencies

- Transactions, debts, financial health, subscriptions, budgets for context. Subscription may gate advanced insights (plan-features-service, BlockedFeature).

## Subscription / Access

- Authenticated users. Full insights or Spair Score breakdown may be premium.
