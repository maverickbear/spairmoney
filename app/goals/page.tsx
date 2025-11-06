"use client";

import { useState, useEffect } from "react";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalForm } from "@/components/forms/goal-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/components/common/money";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentBalance: number;
  incomePercentage: number;
  priority: "High" | "Medium" | "Low";
  isPaused: boolean;
  isCompleted: boolean;
  completedAt?: string | null;
  description?: string | null;
  expectedIncome?: number | null;
  targetMonths?: number | null;
  createdAt: string;
  updatedAt: string;
  monthlyContribution?: number;
  monthsToGoal?: number | null;
  progressPct?: number;
  incomeBasis?: number;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [sortBy, setSortBy] = useState<"priority" | "progress" | "eta">("priority");
  const [filterBy, setFilterBy] = useState<"all" | "active" | "paused" | "completed">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    try {
      setLoading(true);
      const res = await fetch("/api/goals");
      if (!res.ok) {
        throw new Error("Failed to fetch goals");
      }
      const data = await res.json();
      setGoals(data);
    } catch (error) {
      console.error("Error loading goals:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to delete goal");
      }

      loadGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
      alert(error instanceof Error ? error.message : "Failed to delete goal");
    }
  }

  async function handlePause(id: string, isPaused: boolean) {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaused: !isPaused }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to update goal");
      }

      loadGoals();
    } catch (error) {
      console.error("Error pausing/resuming goal:", error);
      alert(error instanceof Error ? error.message : "Failed to update goal");
    }
  }

  async function handleTopUp(id: string) {
    setSelectedGoal(goals.find((g) => g.id === id) || null);
    setIsTopUpOpen(true);
  }

  async function handleWithdraw(id: string) {
    setSelectedGoal(goals.find((g) => g.id === id) || null);
    setIsWithdrawOpen(true);
  }

  async function submitTopUp() {
    if (!selectedGoal) return;

    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}/top-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to add top-up");
      }

      setIsTopUpOpen(false);
      setTopUpAmount("");
      setSelectedGoal(null);
      loadGoals();
    } catch (error) {
      console.error("Error adding top-up:", error);
      alert(error instanceof Error ? error.message : "Failed to add top-up");
    }
  }

  async function submitWithdraw() {
    if (!selectedGoal) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (amount > selectedGoal.currentBalance) {
      alert("Withdrawal amount cannot exceed current balance");
      return;
    }

    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to withdraw");
      }

      setIsWithdrawOpen(false);
      setWithdrawAmount("");
      setSelectedGoal(null);
      loadGoals();
    } catch (error) {
      console.error("Error withdrawing:", error);
      alert(error instanceof Error ? error.message : "Failed to withdraw");
    }
  }

  // Filter and sort goals
  const filteredGoals = goals.filter((goal) => {
    if (filterBy === "active") return !goal.isCompleted && !goal.isPaused;
    if (filterBy === "paused") return goal.isPaused;
    if (filterBy === "completed") return goal.isCompleted;
    return true;
  });

  const sortedGoals = [...filteredGoals].sort((a, b) => {
    if (sortBy === "priority") {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    if (sortBy === "progress") {
      return (b.progressPct || 0) - (a.progressPct || 0);
    }
    if (sortBy === "eta") {
      const aETA = a.monthsToGoal ?? Infinity;
      const bETA = b.monthsToGoal ?? Infinity;
      return aETA - bETA;
    }
    return 0;
  });

  // Calculate total allocation
  const activeGoals = goals.filter((g) => !g.isCompleted && !g.isPaused);
  const totalAllocation = activeGoals.reduce((sum, g) => sum + (g.incomePercentage || 0), 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Savings Goals</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Track your progress toward your financial goals
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setSelectedGoal(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Goal
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Filter:</label>
            <Select value={filterBy} onValueChange={(value) => setFilterBy(value as typeof filterBy)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Goals</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Sort:</label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="eta">ETA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Total Allocation: </span>
          <span className={`font-semibold ${totalAllocation > 100 ? "text-red-600" : "text-green-600"}`}>
            {totalAllocation.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Loading goals...
          </div>
        ) : sortedGoals.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {filterBy === "all"
              ? "No goals created yet. Create one to get started."
              : `No ${filterBy} goals found.`}
          </div>
        ) : (
          sortedGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onEdit={(g) => {
              // Ensure the selected goal has createdAt and updatedAt properties
              setSelectedGoal({ ...g, createdAt: goal.createdAt, updatedAt: goal.updatedAt });
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
            onPause={handlePause}
            onTopUp={handleTopUp}
            onWithdraw={handleWithdraw}
          />
          ))
        )}
      </div>

      <GoalForm
        goal={selectedGoal || undefined}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setSelectedGoal(null);
          }
        }}
        onSuccess={() => {
          loadGoals();
          setSelectedGoal(null);
        }}
      />

      <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Top-up</DialogTitle>
            <DialogDescription>
              Add money to {selectedGoal?.name || "this goal"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTopUpOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitTopUp}>Add Top-up</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw from Goal</DialogTitle>
            <DialogDescription>
              Withdraw money from {selectedGoal?.name || "this goal"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              {selectedGoal && (
                <p className="text-xs text-muted-foreground">
                  Current balance: {formatMoney(selectedGoal.currentBalance)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWithdrawOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitWithdraw}>Withdraw</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

