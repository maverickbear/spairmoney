"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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

const GaugeComponent = dynamic(() => import("react-gauge-component"), {
  ssr: false,
  loading: () => <GaugePlaceholder isEmpty classification="—" />,
});

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

/** Duration for 0→score animation (ms) */
const GAUGE_ANIMATION_DURATION = 1600;
const GAUGE_ANIMATION_DELAY = 80;

/** Map known API (English) insight titles to dashboard translation keys for i18n */
const INSIGHT_TITLE_KEYS: Record<string, string> = {
  "Add This Month's Transactions": "addThisMonthsTransactions",
  "Add this month's transactions": "addThisMonthsTransactions",
};

/**
 * Static placeholder so the gauge area is always visible (no layout shift).
 * Matches the gauge container size and shows a gray semicircle.
 */
function GaugePlaceholder({
  isEmpty,
  classification,
  noDataLabel = "No data",
}: {
  isEmpty: boolean;
  classification: string;
  noDataLabel?: string;
}) {
  return (
    <div
      className="gauge w-full flex flex-col items-center justify-start"
      style={{
        aspectRatio: "300 / 147",
        minHeight: "120px",
        maxWidth: "100%",
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 300 147"
        className="w-full h-full block"
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      >
        {/* Gray semicircle arc (same idea as gauge) */}
        <path
          d="M 30 135 A 120 120 0 0 1 270 135"
          fill="none"
          stroke="var(--muted-border, #d1d5db)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <text
          x="150"
          y="105"
          textAnchor="middle"
          style={{
            fontSize: "48px",
            fontWeight: 800,
            fill: "var(--muted-foreground)",
          }}
        >
          {isEmpty ? "0 / 100" : "—"}
        </text>
      </svg>
      <p
        className={cn(
          "text-sm font-medium mt-0.5",
          isEmpty ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {isEmpty ? noDataLabel : classification}
      </p>
    </div>
  );
}

interface SpairScoreFullWidthWidgetProps {
  data: SpairScoreWidgetData | null;
  onOpenDetails: () => void;
}

export function SpairScoreFullWidthWidget({ data, onOpenDetails }: SpairScoreFullWidthWidgetProps) {
  const t = useTranslations("dashboard");
  const [infoOpen, setInfoOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  /** Value shown on gauge: start at 0 then animate to score so 0→100 animation runs */
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !data) return;
    const empty = data.details?.isEmptyState ?? false;
    const hasScoreData = !empty;
    const targetScore = data.score ?? 0;
    if (!hasScoreData) {
      setAnimatedScore(0);
      return;
    }
    const t = setTimeout(() => setAnimatedScore(targetScore), GAUGE_ANIMATION_DELAY);
    return () => clearTimeout(t);
  }, [mounted, data?.score, data?.details?.isEmptyState]);

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
  const topInsightRaw =
    details?.alerts?.find((a) => a.severity === "critical")?.title ??
    details?.alerts?.find((a) => a.severity === "warning")?.title ??
    details?.suggestions?.[0]?.title ??
    (data?.message && data.message.trim() ? data.message : null);
  // Map known API (English) insight titles to translation keys for i18n
  const topInsight =
    topInsightRaw && INSIGHT_TITLE_KEYS[topInsightRaw]
      ? t(INSIGHT_TITLE_KEYS[topInsightRaw])
      : topInsightRaw;

  const pointsToNextTier = hasData ? getPointsToNextTier(score) : null;
  const progressToNextLevel = hasData ? getProgressToNextLevel(score) : null;

  const metrics = details
    ? [
        {
          label: t("savingsRate"),
          value: empty ? t("noData") : `${details.savingsRate.toFixed(1)}%`,
          hint: empty ? t("spairScoreEmptySavingsRateHint") : t("ofIncomeSaved"),
          good: details.savingsRate >= 20,
        },
        {
          label: t("emergencyFundLabel"),
          value: empty ? t("noData") : `${details.emergencyFundMonths.toFixed(1)} mo`,
          hint: empty ? t("spairScoreEmptyEmergencyFundHint") : t("monthsOfExpenses"),
          good: details.emergencyFundMonths >= 6,
        },
        {
          label: t("debtLabel"),
          value: empty ? t("noData") : details.debtExposure,
          hint: empty ? t("spairScoreEmptyDebtHint") : t("exposureLevel"),
          good: details.debtExposure === "Low",
        },
        {
          label: t("spendingLabel"),
          value: empty ? t("noData") : details.spendingDiscipline,
          hint: empty ? t("spairScoreEmptySpendingHint") : t("vsBudget"),
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
            <h2 className="text-lg font-semibold">{t("spairScore")}</h2>
            <Popover open={infoOpen} onOpenChange={setInfoOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label={t("whatIsSpairScore")}
                >
                  <Info className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 space-y-3" align="start">
                <p className="text-sm font-medium">{t("whatIsSpairScore")}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("whatIsSpairScoreDescription")}
                </p>
                <Button size="small" className="w-full" onClick={handleViewDetails}>
                  {t("viewDetails")}
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
              {t("viewDetails")}
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
              <div className="flex flex-col items-center gap-1 w-full min-h-[120px]">
                {!mounted ? (
                  <GaugePlaceholder isEmpty={!hasScoreData} classification={classification} noDataLabel={t("noData")} />
                ) : (
                  <GaugeComponent
                    type="semicircle"
                    arc={hasScoreData ? SPAIR_SCORE_ARC : GRAY_ARC}
                    value={hasScoreData ? animatedScore : 0}
                    minValue={0}
                    maxValue={100}
                    pointer={{
                      type: "blob",
                      hide: !hasScoreData,
                      baseColor: "#fff",
                      strokeColor: "#000",
                      strokeWidth: 4,
                      blobOffset: 0.5,
                      animate: true,
                      animationDuration: GAUGE_ANIMATION_DURATION,
                      animationDelay: GAUGE_ANIMATION_DELAY,
                    }}
                    labels={{
                      valueLabel: {
                        formatTextValue: (val: number) => (hasScoreData ? String(Math.round(val)) : "0 / 100"),
                        animateValue: true,
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
                )}
                <p className={cn("text-sm font-medium mt-0.5", !hasScoreData ? "text-muted-foreground" : "text-foreground")}>
                  {!hasScoreData ? t("noData") : classification}
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
                        empty && "text-muted-foreground",
                        !empty && m.good && "text-sentiment-positive",
                        !empty && !m.good && "text-sentiment-warning"
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
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t("stats")}</p>
              <p className={cn("mt-1 text-xl sm:text-2xl font-bold tabular-nums", pointsToNextTier === null && "text-muted-foreground")}>
                {pointsToNextTier !== null ? pointsToNextTier : t("noData")}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">{t("pointsToNextTier")}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 sm:p-4 text-card-foreground min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t("progress")}</p>
              <p className={cn("mt-1 text-xl sm:text-2xl font-bold tabular-nums", progressToNextLevel === null && "text-muted-foreground")}>
                {progressToNextLevel !== null ? `${progressToNextLevel}%` : t("noData")}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">{t("toNextLevel")}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
