"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarAmountInput } from "@/components/common/dollar-amount-input";
import { Slider } from "@/components/ui/slider";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type LimitPeriod = "per-transaction" | "annually" | "monthly" | "total";

export function SpendLimitDemo() {
  const [amount, setAmount] = useState(500);
  const [selectedPeriod, setSelectedPeriod] = useState<LimitPeriod>("monthly");

  const handleSliderChange = (value: number[]) => {
    setAmount(value[0]);
  };

  const handleInputChange = (value: number | undefined) => {
    if (value !== undefined) {
      setAmount(value);
    }
  };

  const periods: Array<{ id: LimitPeriod; label: string }> = [
    { id: "per-transaction", label: "Per Transaction" },
    { id: "annually", label: "Annually" },
    { id: "monthly", label: "Monthly" },
    { id: "total", label: "Total" },
  ];

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-2">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Spend Limit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount Input */}
        <div className="space-y-2">
          <DollarAmountInput
            value={amount}
            onChange={handleInputChange}
            placeholder="$ 0.00"
            className="text-2xl font-semibold"
          />
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <Slider
            value={[amount]}
            onValueChange={handleSliderChange}
            min={0}
            max={10000}
            step={10}
            className="w-full"
          />
        </div>

        {/* Period Options */}
        <div className="grid grid-cols-2 gap-2">
          {periods.map((period) => {
            const isSelected = selectedPeriod === period.id;
            return (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={cn(
                  "relative p-3 rounded-lg border-2 transition-all text-sm font-medium",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50"
                )}
              >
                {period.label}
                {isSelected && (
                  <Check className="absolute top-1 right-1 h-4 w-4" />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

