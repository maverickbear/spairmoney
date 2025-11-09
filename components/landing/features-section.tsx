"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Globe, Zap, TrendingUp } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: BarChart3,
      title: "Bank Account Integration",
      description: "Connect your accounts securely with Plaid. Transactions sync automatically—no manual entry required. Save hours every month.",
      value: "Auto-sync",
      label: "Bank Integration",
    },
    {
      icon: Globe,
      title: "AI-Powered Categorization",
      description: "Our smart system learns your spending patterns and automatically categorizes transactions. Just approve or adjust—it gets smarter over time.",
      iconLarge: true,
    },
    {
      icon: Zap,
      title: "Real-Time Dashboard",
      description: "See your complete financial picture at a glance. Track spending, monitor budgets, and watch your savings grow—all updated in real-time.",
    },
    {
      icon: TrendingUp,
      title: "Smart Goal Tracking",
      description: "Set savings goals with automatic progress tracking. Our system calculates how long it'll take to reach your goals based on your actual income.",
    },
  ];

  const stats = [
    { value: "100%", label: "Secure & Encrypted", icon: "🔒" },
    { value: "Auto", label: "Bank Sync", icon: "⚡" },
    { value: "24/7", label: "Real-Time Updates", icon: "🔄" },
    { value: "$0", label: "Start Free", icon: "✨" },
  ];

  return (
    <section id="features" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to Master Your Money
          </h2>
          <p className="text-lg text-muted-foreground">
            Stop juggling spreadsheets and multiple apps. Get a complete financial command center that works automatically—so you can focus on what matters.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-primary/10 rounded-[12px]">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    {feature.value && (
                      <div className="text-right">
                        <p className="text-2xl font-bold">{feature.value}</p>
                        <p className="text-sm text-muted-foreground">{feature.label}</p>
                      </div>
                    )}
                    {feature.iconLarge && (
                      <div className="p-4 bg-primary rounded-[12px]">
                        <Zap className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-3xl md:text-4xl font-bold">{stat.value}</span>
                <span className="text-2xl text-primary">{stat.icon}</span>
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

