"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardOverview } from "@/components/admin/dashboard-overview";
import { FinancialOverview } from "@/components/admin/financial-overview";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<{
    overview: any;
    financial: any;
    planDistribution: any[];
  } | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [systemSettings, setSystemSettings] = useState<{ maintenanceMode: boolean } | null>(null);

  useEffect(() => {
    loadDashboard();
    loadSystemSettings();
  }, []);

  async function loadDashboard() {
    try {
      setLoadingDashboard(true);
      const response = await fetch("/api/admin/dashboard");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to load dashboard data";
        console.error("Error loading dashboard:", errorMessage);
        setDashboardData(null);
        return;
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setDashboardData(null);
    } finally {
      setLoadingDashboard(false);
    }
  }

  async function loadSystemSettings() {
    try {
      const response = await fetch("/api/admin/system-settings");
      if (response.ok) {
        const data = await response.json();
        setSystemSettings(data);
      }
    } catch (error) {
      console.error("Error loading system settings:", error);
    }
  }

  return (
    <div className="w-full p-4 lg:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">System Overview</h2>
          <p className="text-sm text-muted-foreground">
            Key metrics and statistics about the platform
          </p>
        </div>
        <DashboardOverview
          overview={dashboardData?.overview || {
            totalUsers: 0,
            usersWithoutSubscription: 0,
            totalSubscriptions: 0,
            activeSubscriptions: 0,
            trialingSubscriptions: 0,
            cancelledSubscriptions: 0,
            pastDueSubscriptions: 0,
            churnRisk: 0,
          }}
          loading={loadingDashboard}
          initialMaintenanceMode={systemSettings?.maintenanceMode ?? false}
          onMaintenanceModeChange={(value) => {
            setSystemSettings(prev => prev ? { ...prev, maintenanceMode: value } : { maintenanceMode: value });
          }}
          onCardClick={(filterType) => {
            router.push(`/portal-management/users?filter=${filterType}`);
          }}
        />

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Financial Overview</h2>
          <p className="text-sm text-muted-foreground">
            Revenue metrics, MRR, and future revenue projections
          </p>
        </div>
        <FinancialOverview
          financial={dashboardData?.financial || {
            mrr: 0,
            estimatedFutureMRR: 0,
            totalEstimatedMRR: 0,
            subscriptionDetails: [],
            upcomingTrials: [],
          }}
          loading={loadingDashboard}
        />
      </div>
    </div>
  );
}

