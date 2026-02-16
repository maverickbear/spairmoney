"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { SpairScoreWidgetData } from "@/src/domain/dashboard/types";
import { Info } from "lucide-react";

const GaugeComponent = dynamic(() => import("react-gauge-component"), { ssr: false });

/** Tier thresholds: 85 Excellent, 70 Strong, 55 Fair, 40 Fragile */
const TIER_THRESHOLDS = [40, 55, 70, 85] as const;

function getPointsToNextTier(score: number): number | null {
  for (const t of TIER_THRESHOLDS) {
    if (score < t) return t - score;
  }
  return null;
}

function getProgressToNextLevel(score: number): number | null {
  if (score >= 85) return null;
  let tierStart = 0;
  for (const t of TIER_THRESHOLDS) {
    if (score < t) return Math.round(((score - tierStart) / (t - tierStart)) * 100);
    tierStart = t;
  }
  return null;
}

/** Spair Score bands: Critical 0-39, Fragile 40-54, Fair 55-69, Strong 70-84, Excellent 85-100 */
const SPAIR_SCORE_ARC = {
  width: 0.12,
  padding: 0.01,
  cornerRadius: 8,
  subArcs: [
    { limit: 40, color: "#ef4444" },
    { limit: 54, color: "#f97316" },
    { limit: 69, color: "#eab308" },
    { limit: 84, color: "#84cc16" },
    { limit: 100, color: "#22c55e" },
  ],
};

/** Gray arc for disabled / no-data state */
const GRAY_ARC = {
  width: 0.12,
  padding: 0.01,
  cornerRadius: 8,
  subArcs: [{ limit: 100, color: "#d1d5db" }],
};

interface SpairScoreFullWidthWidgetProps {
  data: SpairScoreWidgetData | null;
  onOpenDetails: () => void;
}

export function SpairScoreFullWidthWidget({ data, onOpenDetails }: SpairScoreFullWidthWidgetProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const details = data?.details;
  const empty = details?.isEmptyState ?? false;
  const score = data?.score ?? 0;
  const classification = data?.classification ?? "—";
  const hasData = data != null;
  /** True when we have real score data to show; false = show gray gauge, "—", no marker */
  const hasScoreData = hasData && !empty;

  const handleViewDetails = () => {
    setInfoOpen(false);
    onOpenDetails();
  };

  // Single most important insight: critical alert > warning alert > first suggestion > widget message
  const topInsight =
    details?.alerts?.find((a) => a.severity === "critical")?.title ??
    details?.alerts?.find((a) => a.severity === "warning")?.title ??
    details?.suggestions?.[0]?.title ??
    (data?.message && data.message.trim() ? data.message : null);

  const pointsToNextTier = hasData ? getPointsToNextTier(score) : null;
  const progressToNextLevel = hasData ? getProgressToNextLevel(score) : null;

  const metrics = details
    ? [
        {
          label: "Savings Rate",
          value: empty ? "—" : `${details.savingsRate.toFixed(1)}%`,
          hint: "of income saved",
          good: details.savingsRate >= 20,
        },
        {
          label: "Emergency Fund",
          value: empty ? "—" : `${details.emergencyFundMonths.toFixed(1)} mo`,
          hint: "months of expenses",
          good: details.emergencyFundMonths >= 6,
        },
        {
          label: "Debt",
          value: empty ? "—" : details.debtExposure,
          hint: "exposure level",
          good: details.debtExposure === "Low",
        },
        {
          label: "Spending",
          value: empty ? "—" : details.spendingDiscipline,
          hint: "vs budget",
          good: details.spendingDiscipline === "Excellent" || details.spendingDiscipline === "Good",
        },
      ]
    : [];

  return (
    <Card className="w-full min-w-0 overflow-hidden">
      <CardContent className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 min-w-0">
        {/* Title with info + insight and Details on the right */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Spair Score</h2>
            <Popover open={infoOpen} onOpenChange={setInfoOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="What is Spair Score?"
                >
                  <Info className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 space-y-3" align="start">
                <p className="text-sm font-medium">What is Spair Score?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Spair Score is your financial health rating from 0 to 100. It reflects your ability to afford your lifestyle, absorb shocks, and keep healthy money habits — not how much you have. The score is coaching-oriented and action-driven: it helps you see what to improve and how.
                </p>
                <Button size="small" className="w-full" onClick={handleViewDetails}>
                  View Details
                </Button>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            {topInsight && (
              <p className="text-[14px] text-muted-foreground truncate max-w-full" title={topInsight}>
                {topInsight}
              </p>
            )}
            <Button variant="outline" size="small" onClick={onOpenDetails} className="shrink-0">
              Details
            </Button>
          </div>
        </div>

        {/* Row 1: Gauge | Metrics list - stack until md so 768px content still has room */}
        <div className="flex flex-col gap-4 sm:gap-5 min-w-0">
          <div className="flex flex-col md:flex-row shrink-0 items-center md:items-start gap-4 md:gap-6 min-w-0">
            <div
              className="flex shrink-0 flex-col items-center justify-start gap-2 sm:gap-4 w-full md:w-auto max-w-[200px] sm:max-w-[220px] md:max-w-none mx-auto md:mx-0 min-w-0"
              style={{
                height: "fit-content",
                overflow: "visible",
                paddingTop: 0,
                paddingBottom: 0,
              }}
            >
              <div className="flex flex-col items-center gap-1">
                {mounted ? (
                  <GaugeComponent
                    type="semicircle"
                    arc={hasScoreData ? SPAIR_SCORE_ARC : GRAY_ARC}
                    value={hasScoreData ? score : 0}
                    minValue={0}
                    maxValue={100}
                    pointer={{ hide: true }}
                    labels={{
                      valueLabel: {
                        formatTextValue: (val: number) => (hasScoreData ? String(Math.round(val)) : "—"),
                        style: {
                          color: hasScoreData ? "#000" : "var(--muted-foreground)",
                          fill: hasScoreData ? "#000" : "var(--muted-foreground)",
                          fontWeight: 800,
                          textShadow: "none",
                          fontSize: "48px",
                        },
                        effects: { glow: false, textShadow: "none" },
                      },
                      tickLabels: { hideMinMax: true },
                    }}
                    style={{
                      width: "100%",
                      height: "fit-content",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      alignItems: "center",
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center gap-2 h-[100px] w-[120px]">
                    <span className="text-3xl font-bold tabular-nums">{!hasData ? "—" : score}</span>
                    <span className="text-base text-muted-foreground">/ 100</span>
                  </div>
                )}
                <p className={cn("text-sm font-medium mt-0.5", !hasScoreData ? "text-muted-foreground" : "text-foreground")}>
                  {!hasScoreData ? "No data" : classification}
                </p>
              </div>
            </div>
            {metrics.length > 0 && (
              <ul className="grid h-full w-full min-w-0 md:flex-1 grid-cols-2 gap-x-4 gap-y-4 md:gap-x-6 md:gap-y-6 py-2 md:py-[15px] text-[13px] sm:text-[14px]" role="list">
                {metrics.map((m) => (
                  <li key={m.label} className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground">{m.label}</span>
                    <span
                      className={cn(
                        "text-base font-semibold tabular-nums",
                        !empty && m.good && "text-green-700 dark:text-green-400",
                        !empty && !m.good && m.value !== "—" && "text-amber-700 dark:text-amber-400"
                      )}
                    >
                      {m.value}
                    </span>
                    <span className="text-xs text-muted-foreground" aria-hidden="true">
                      {m.hint}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Stats & Progress cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-lg border border-border bg-card p-3 sm:p-4 text-card-foreground min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Stats</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums">
                {pointsToNextTier !== null ? pointsToNextTier : "—"}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Points to next tier</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 sm:p-4 text-card-foreground min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Progress</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums">
                {progressToNextLevel !== null ? `${progressToNextLevel}%` : "—"}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">To next level</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
