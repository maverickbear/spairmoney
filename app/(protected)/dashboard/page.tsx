import { Suspense } from "react";
import { DashboardRealtime } from "@/components/dashboard/dashboard-realtime";
import { DashboardUpdateChecker } from "@/components/dashboard/dashboard-update-checker";
import { TrialCelebration } from "@/components/dashboard/trial-celebration";
import { UrlCleanup } from "@/components/common/url-cleanup";
import { PageHeader } from "@/components/common/page-header";
import { startServerPagePerformance } from "@/lib/utils/performance";
import { DashboardSnapshotProvider } from "@/src/presentation/contexts/dashboard-snapshot-context";
import { DashboardWidgetsClient } from "@/src/presentation/components/features/dashboard/dashboard-widgets-client";

interface DashboardProps {
  searchParams: Promise<{ month?: string; range?: string }>;
}

export default async function Dashboard({ searchParams }: DashboardProps) {
  await searchParams;
  const perf = startServerPagePerformance("Dashboard");
  perf.end();

  return (
    <div>
      <Suspense fallback={null}>
        <UrlCleanup />
        <TrialCelebration />
      </Suspense>

      <PageHeader title="Dashboard" />

      {/* Dashboard: single aggregated source, snapshot → version check → conditional refetch */}
      <DashboardSnapshotProvider>
        <Suspense fallback={
          <div className="w-full p-4 lg:p-8">
            <div className="space-y-6">
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        }>
          <DashboardWidgetsClient />
        </Suspense>
        <DashboardUpdateChecker />
        <DashboardRealtime />
      </DashboardSnapshotProvider>
    </div>
  );
}

