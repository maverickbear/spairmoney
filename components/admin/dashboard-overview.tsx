"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, TrendingUp, AlertTriangle, UserX, Calendar } from "lucide-react";

interface DashboardOverviewProps {
  overview: {
    totalUsers: number;
    usersWithoutSubscription: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    trialingSubscriptions: number;
    cancelledSubscriptions: number;
    pastDueSubscriptions: number;
    churnRisk: number;
  };
  loading?: boolean;
}

export function DashboardOverview({ overview, loading }: DashboardOverviewProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const subscriptionRate =
    overview.totalUsers > 0
      ? ((overview.totalSubscriptions / overview.totalUsers) * 100).toFixed(1)
      : "0.0";

  const activeRate =
    overview.totalUsers > 0
      ? ((overview.activeSubscriptions / overview.totalUsers) * 100).toFixed(1)
      : "0.0";

  const trialRate =
    overview.totalUsers > 0
      ? ((overview.trialingSubscriptions / overview.totalUsers) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {overview.usersWithoutSubscription} without subscription
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {activeRate}% of total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trialing</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.trialingSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {trialRate}% of total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {subscriptionRate}% subscription rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.cancelledSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Cancelled subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Past Due</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.pastDueSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Payment issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.churnRisk}</div>
            <p className="text-xs text-muted-foreground">
              Will cancel at period end
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

