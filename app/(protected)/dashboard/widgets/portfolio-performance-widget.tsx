"use client";

import { useSubscription } from "@/hooks/use-subscription";
import { usePortfolioData } from "@/hooks/use-portfolio-data";
import { PortfolioPerformanceChart } from "@/components/portfolio/portfolio-performance-chart";
import { CardSkeleton } from "@/components/ui/card-skeleton";

interface PortfolioPerformanceWidgetProps {
  savings: number; // Fallback value if no portfolio data
}

interface PortfolioSummary {
  totalValue: number;
}

export function PortfolioPerformanceWidget({
  savings,
}: PortfolioPerformanceWidgetProps) {
  const { limits, checking: limitsLoading } = useSubscription();

  // Check if user has access to investments feature
  const hasInvestmentsAccess = limits.hasInvestments === true;

  // OPTIMIZED: Use shared portfolio hook to avoid duplicate API calls
  // This hook deduplicates requests and shares data between widgets
  const { data: portfolioData, isLoading } = usePortfolioData({
    days: 30,
    enabled: hasInvestmentsAccess,
  });

  const portfolioSummary = portfolioData.summary as PortfolioSummary | null;
  
  // Ensure historical data is sorted by date (ascending)
  const historicalData = portfolioData.historical.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });

  // Show loading state while checking limits or loading data
  if (limitsLoading || isLoading) {
    return <CardSkeleton />;
  }

  // If user doesn't have access to investments, show nothing or a message
  if (!hasInvestmentsAccess) {
    return null;
  }

  // Use portfolio data if available, otherwise fallback to savings
  const currentValue = portfolioSummary?.totalValue ?? savings;

  // Always show the chart, even if there's no historical data
  // The chart component will handle empty data gracefully
  // Dashboard widget defaults to 1M (1 month) view
  return (
    <PortfolioPerformanceChart
      data={historicalData}
      currentValue={currentValue}
      defaultPeriod="1M"
    />
  );
}

