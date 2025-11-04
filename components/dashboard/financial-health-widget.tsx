"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FinancialHealthData } from "@/lib/api/financial-health";
import { FinancialHealthModal } from "./financial-health-modal";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Heart,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/components/common/money";

interface FinancialHealthWidgetProps {
  data: FinancialHealthData;
}

export function FinancialHealthWidget({ data }: FinancialHealthWidgetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case "Excellent":
        return "text-green-600 dark:text-green-400";
      case "Good":
        return "text-blue-600 dark:text-blue-400";
      case "Fair":
        return "text-yellow-600 dark:text-yellow-400";
      case "Poor":
        return "text-orange-600 dark:text-orange-400";
      case "Critical":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getClassificationBgColor = (classification: string) => {
    switch (classification) {
      case "Excellent":
        return "bg-green-100 dark:bg-green-900/20";
      case "Good":
        return "bg-blue-100 dark:bg-blue-900/20";
      case "Fair":
        return "bg-yellow-100 dark:bg-yellow-900/20";
      case "Poor":
        return "bg-orange-100 dark:bg-orange-900/20";
      case "Critical":
        return "bg-red-100 dark:bg-red-900/20";
      default:
        return "bg-muted";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 20) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const mainAlerts = data.alerts.slice(0, 3);
  const hasAlerts = data.alerts.length > 0;

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Financial Health
          </CardTitle>
          <CardDescription>
            Complete analysis of your financial situation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className={cn("text-5xl font-bold", getScoreColor(data.score))}>
                  {data.score}
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold w-fit",
                getClassificationBgColor(data.classification),
                getClassificationColor(data.classification)
              )}>
                {data.classification === "Excellent" && <CheckCircle2 className="h-4 w-4" />}
                {data.classification === "Critical" && <AlertTriangle className="h-4 w-4" />}
                {data.classification}
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - data.score / 100)}`}
                  className={getScoreColor(data.score)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-lg font-semibold", getScoreColor(data.score))}>
                  {data.score}%
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Months of Reserve</p>
              <p className="text-lg font-semibold">
                {data.monthsOfReserve.toFixed(1)}
                <span className="text-sm text-muted-foreground ml-1">months</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Savings Rate</p>
              <p className={cn(
                "text-lg font-semibold flex items-center gap-1",
                data.savingsRate >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {data.savingsRate >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {data.savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Alerts */}
          {hasAlerts && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Main Alerts</p>
              <div className="space-y-2">
                {mainAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-2 p-3 rounded-lg border",
                      alert.severity === "critical" 
                        ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                        : alert.severity === "warning"
                        ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"
                        : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                    )}
                  >
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View Details Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsModalOpen(true)}
          >
            View Full Details
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      <FinancialHealthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={data}
      />
    </>
  );
}

