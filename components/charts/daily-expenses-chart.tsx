"use client";

import { useTranslations } from "next-intl";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartCard } from "./chart-card";
import { formatMoney } from "@/components/common/money";
import { sentiment } from "@/lib/design-system/colors";

interface DailyExpensesData {
  date: string;
  amount: number;
}

interface DailyExpensesChartProps {
  data: DailyExpensesData[];
}

export function DailyExpensesChart({ data }: DailyExpensesChartProps) {
  const t = useTranslations("reports");
  return (
    <ChartCard title={t("dailyExpenses")} description={t("expensesByDayCurrentMonth")}>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => formatMoney(Number(value))} />
          <Line type="monotone" dataKey="amount" stroke={sentiment.negative} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

