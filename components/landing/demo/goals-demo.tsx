"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProgressRing } from "@/components/goals/progress-ring";
import { formatMoney } from "@/components/common/money";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, CheckCircle2 } from "lucide-react";

const fakeGoals = [
  {
    id: "1",
    name: "Emergency Fund",
    targetAmount: 10000,
    currentBalance: 6500,
    incomePercentage: 15,
    priority: "High" as const,
    isCompleted: false,
    progressPct: 65,
    monthsToGoal: 8,
  },
  {
    id: "2",
    name: "Vacation Fund",
    targetAmount: 5000,
    currentBalance: 3200,
    incomePercentage: 10,
    priority: "Medium" as const,
    isCompleted: false,
    progressPct: 64,
    monthsToGoal: 6,
  },
  {
    id: "3",
    name: "New Car",
    targetAmount: 25000,
    currentBalance: 8500,
    incomePercentage: 20,
    priority: "High" as const,
    isCompleted: false,
    progressPct: 34,
    monthsToGoal: 18,
  },
];

export function GoalsDemo() {
  // Calculate statistics
  const activeGoals = fakeGoals.filter((g) => !g.isCompleted);
  const completedGoals = fakeGoals.filter((g) => g.isCompleted);

  const totalTarget = fakeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalBalance = fakeGoals.reduce((sum, g) => sum + g.currentBalance, 0);
  const overallProgress = totalTarget > 0 ? (totalBalance / totalTarget) * 100 : 0;

  const totalMonthlyContribution = activeGoals.reduce(
    (sum, g) => sum + (g.incomePercentage || 0),
    0
  );

  // Get top 3 goals by priority and progress
  const topGoals = [...fakeGoals]
    .filter((g) => !g.isCompleted)
    .sort((a, b) => {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return (b.progressPct || 0) - (a.progressPct || 0);
    })
    .slice(0, 3);

  const priorityColors = {
    High: "bg-red-500 dark:bg-red-600 hover:bg-red-500 dark:hover:bg-red-600",
    Medium: "bg-yellow-500 dark:bg-yellow-600 hover:bg-yellow-500 dark:hover:bg-yellow-600",
    Low: "bg-blue-500 dark:bg-blue-600 hover:bg-blue-500 dark:hover:bg-blue-600",
  };

  return (
    <Card className="w-full h-[500px] flex flex-col" style={{ pointerEvents: "none" }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Goals Overview</CardTitle>
            <CardDescription>Track your financial progress</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-6">
        {/* Overall Progress */}
        <div className="flex items-center gap-6">
          <div className="flex-shrink-0">
            <ProgressRing
              percentage={overallProgress}
              size={80}
              strokeWidth={8}
            />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Progress</span>
              <span className="text-sm font-semibold">{overallProgress.toFixed(1)}%</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Invested</span>
                <span className="font-medium">{formatMoney(totalBalance)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Target</span>
                <span className="font-medium">{formatMoney(totalTarget)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Goals */}
        {topGoals.length > 0 && (
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">Top Goals</h4>
            <div className="space-y-3">
              {topGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center gap-3 p-2 rounded-[12px]"
                >
                  <div className="flex-shrink-0">
                    <ProgressRing
                      percentage={goal.progressPct || 0}
                      size={48}
                      strokeWidth={6}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{goal.name}</p>
                      <Badge
                        className={`${priorityColors[goal.priority]} text-white text-[10px] px-1.5 py-0`}
                      >
                        {goal.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {formatMoney(goal.currentBalance)} / {formatMoney(goal.targetAmount)}
                      </span>
                      {goal.monthsToGoal !== null && goal.monthsToGoal !== undefined && (
                        <span className="text-muted-foreground">
                          {goal.monthsToGoal > 0 ? (
                            <>
                              {goal.monthsToGoal >= 12
                                ? `${Math.floor(goal.monthsToGoal / 12)}y `
                                : ""}
                              {Math.round(goal.monthsToGoal % 12)}m
                            </>
                          ) : (
                            "Reached!"
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

