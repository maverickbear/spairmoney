"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  TrendingUp, 
  Target, 
  BarChart3,
  PiggyBank,
  CreditCard,
  Calendar,
  Users,
  Shield,
  ArrowRight,
  Repeat,
  Brain
} from "lucide-react";
import { ExpenseTrackingMockup } from "./demo/expense-tracking-mockup";
import { SavingsGoalsMockup } from "./demo/savings-goals-mockup";
import { AnalyticsMockup } from "./demo/analytics-mockup";
import { SpareScoreMockup } from "./demo/spare-score-mockup";
import { HouseholdMockup } from "./demo/household-mockup";

export function FizensFeaturesSection() {
  const mainFeatures = [
    {
      title: "Track Every Expense Automatically",
      description: "Connect your bank accounts and see where every dollar goes. No more guessing—know exactly what you're spending on groceries, bills, entertainment, and more.",
      icon: TrendingUp,
      mockup: <ExpenseTrackingMockup />,
    },
    {
      title: "Manage Finances Together as a Household",
      description: "Invite family members to your household and share accounts, budgets, and goals. Collaborate on financial decisions and track progress together in real-time.",
      icon: Users,
      mockup: <HouseholdMockup />,
    },
    {
      title: "Save Money with Clear Goals",
      description: "Set savings goals and see exactly when you'll reach them. Track progress together as a family and celebrate milestones along the way.",
      icon: BarChart3,
      mockup: <SavingsGoalsMockup />,
    },
  ];

  const additionalFeatures = [
    {
      title: "Smart Budget Management",
      description: "Set flexible budgets by category with real-time tracking. Get visual alerts when approaching limits and see progress over time.",
      icon: BarChart3,
      iconColor: "bg-blue-100 text-blue-600",
    },
    {
      title: "Savings Goals with ETA",
      description: "Set specific savings goals with automatic ETA calculations. Track progress with visual indicators and see exactly when you'll reach your targets.",
      icon: PiggyBank,
      iconColor: "bg-green-100 text-green-600",
    },
    {
      title: "Smart Debt Management",
      description: "Track all debts with payoff strategies. Use avalanche or snowball methods, monitor interest, and optimize your debt payoff plan.",
      icon: CreditCard,
      iconColor: "bg-blue-100 text-blue-600",
    },
    {
      title: "Investment Portfolio Tracking",
      description: "Sync Questrade accounts automatically. Track positions, performance, and asset allocation to see your complete investment picture.",
      icon: TrendingUp,
      iconColor: "bg-purple-100 text-purple-600",
    },
    {
      title: "Comprehensive Reports & Analytics",
      description: "Generate detailed financial reports. Analyze spending by category, track cash flow trends, and export data for taxes or analysis.",
      icon: BarChart3,
      iconColor: "bg-blue-100 text-blue-600",
    },
    {
      title: "Subscription & Planned Payments",
      description: "Track all subscriptions in one place. Schedule planned payments and never miss a bill. Identify opportunities to save on recurring expenses.",
      icon: Repeat,
      iconColor: "bg-pink-100 text-pink-600",
    },
    {
      title: "Household & Multi-User Support",
      description: "Manage finances for your entire household with shared accounts. Collaborate on budgets and goals with family members.",
      icon: Users,
      iconColor: "bg-blue-100 text-blue-600",
    },
    {
      title: "Ask Questions About Your Finances",
      description: "Ask questions in plain language about your spending, savings, and financial health. Get answers based on your actual data to help you learn and understand your finances better.",
      icon: Brain,
      iconColor: "bg-orange-100 text-orange-600",
    },
    {
      title: "Bank-Level Security",
      description: "256-bit encryption, Plaid's SOC 2 Type 2 certification, and Row Level Security. We never store your bank credentials—ever.",
      icon: Shield,
      iconColor: "bg-red-100 text-red-600",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
            Everything You Need
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Know Where Your Money Goes.<br />Learn to Save Together.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
            Track every expense, understand your spending patterns, and get personalized insights to help your family build wealth together.
          </p>
        </div>

        {/* Main Features - Fizens Style with Mockups */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {mainFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="group flex">
                <div className="rounded-2xl border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg bg-card overflow-hidden flex flex-col w-full">
                  {/* Mockup Visual - Fixed Height */}
                  <div className="bg-muted/30 p-6 h-[280px] flex items-center justify-center flex-shrink-0">
                    {feature.mockup}
                  </div>
                  {/* Content */}
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Features Section */}
        <div className="text-center mb-12">
          <p className="text-xl text-muted-foreground font-medium">
            ...and everything else you need to organize your finances
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {additionalFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="p-6 rounded-xl border border-border/50 hover:border-primary/20 transition-all bg-card">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${feature.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA - Fizens Style */}
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">
            A place where families learn to organize their finances together.
          </p>
          <p className="text-xl font-semibold mb-8">
            Start tracking your expenses today and learn to build wealth, not just pay bills.
          </p>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
          >
            Start Organizing Your Finances
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
}

