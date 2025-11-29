import { Suspense } from "react";
import nextDynamic from "next/dynamic";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { loadDashboardData } from "./data-loader";
import { PageHeader } from "@/components/common/page-header";
import { getProfile } from "@/lib/api/profile";
import { DashboardRealtime } from "@/components/dashboard/dashboard-realtime";
import { DashboardUpdateChecker } from "@/components/dashboard/dashboard-update-checker";
import { UrlCleanup } from "@/components/common/url-cleanup";
import { startServerPagePerformance } from "@/lib/utils/performance";
import { startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = 'force-dynamic';

// Lazy load the new Financial Overview page
const FinancialOverviewPage = nextDynamic(() => import("./financial-overview-page").then(m => ({ default: m.FinancialOverviewPage })), { ssr: true });
const OnboardingWidget = nextDynamic(() => import("@/components/dashboard/onboarding-widget").then(m => ({ default: m.OnboardingWidget })), { ssr: true });

type DateRange = "this-month" | "last-month" | "last-60-days" | "last-90-days";

interface DashboardProps {
  searchParams: Promise<{ month?: string; range?: string }>;
}

function calculateDateRange(range: DateRange): { startDate: Date; endDate: Date; selectedMonthDate: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let startDate: Date;
  let endDate: Date;
  let selectedMonthDate: Date;
  
  switch (range) {
    case "this-month":
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
      selectedMonthDate = startDate;
      break;
    case "last-month":
      const lastMonth = subMonths(today, 1);
      startDate = startOfMonth(lastMonth);
      endDate = endOfMonth(lastMonth);
      selectedMonthDate = startDate;
      break;
    case "last-60-days":
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      startDate = subDays(today, 59);
      startDate.setHours(0, 0, 0, 0);
      selectedMonthDate = startDate; // Use start date for compatibility
      break;
    case "last-90-days":
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      startDate = subDays(today, 89);
      startDate.setHours(0, 0, 0, 0);
      selectedMonthDate = startDate; // Use start date for compatibility
      break;
    default:
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
      selectedMonthDate = startDate;
  }
  
  return { startDate, endDate, selectedMonthDate };
}

async function DashboardContent({ 
  selectedMonthDate, 
  startDate, 
  endDate 
}: { 
  selectedMonthDate: Date;
  startDate: Date;
  endDate: Date;
}) {
  const data = await loadDashboardData(selectedMonthDate, startDate, endDate);

  return (
    <>
      {/* Onboarding Widget - Always show if status exists or if we need to check */}
      <OnboardingWidget initialStatus={data.onboardingStatus || undefined} />

      {/* Financial Overview Dashboard */}
      <FinancialOverviewPage
        selectedMonthTransactions={data.selectedMonthTransactions}
        lastMonthTransactions={data.lastMonthTransactions}
        savings={data.savings}
        totalBalance={data.totalBalance}
        lastMonthTotalBalance={data.lastMonthTotalBalance}
        accounts={data.accounts}
        budgets={data.budgets}
        upcomingTransactions={data.upcomingTransactions}
        financialHealth={data.financialHealth}
        goals={data.goals}
        chartTransactions={data.chartTransactions}
        liabilities={data.liabilities}
        debts={data.debts}
        recurringPayments={data.recurringPayments}
        subscriptions={data.subscriptions}
        selectedMonthDate={selectedMonthDate}
        expectedIncomeRange={data.expectedIncomeRange}
      />
    </>
  );
}

export default async function Dashboard({ searchParams }: DashboardProps) {
  const perf = startServerPagePerformance("Dashboard");
  
  // Get selected range from URL or default to "this-month"
  const params = await Promise.resolve(searchParams);
  const rangeParam = params?.range as DateRange | undefined;
  const validRange: DateRange = rangeParam && ["this-month", "last-month", "last-60-days", "last-90-days"].includes(rangeParam)
    ? rangeParam
    : "this-month";
  
  // Calculate date range based on selection
  const { startDate, endDate, selectedMonthDate } = calculateDateRange(validRange);
  
  // Get user profile to personalize the header
  const profile = await getProfile();
  const firstName = profile?.name?.split(' ')[0] || 'there';
  
  perf.end();

  return (
    <div>
      <Suspense fallback={null}>
        <UrlCleanup />
      </Suspense>
      <DashboardRealtime />
      <DashboardUpdateChecker />
      <PageHeader
        title={`Welcome, ${firstName}`}
      >
        <MonthSelector />
      </PageHeader>

      <div className="w-full p-4 lg:p-8">
        <Suspense fallback={null}>
          <DashboardContent 
            selectedMonthDate={selectedMonthDate}
            startDate={startDate}
            endDate={endDate}
          />
        </Suspense>
      </div>
    </div>
  );
}

