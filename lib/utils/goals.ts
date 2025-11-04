/**
 * Goal calculation utilities
 * These are pure functions that can be used on both client and server
 */

export interface GoalForCalculation {
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
}

/**
 * Calculate income percentage needed based on target months
 */
export function calculateIncomePercentageFromTargetMonths(
  targetAmount: number,
  currentBalance: number,
  targetMonths: number,
  incomeBasis: number
): number {
  if (targetMonths <= 0 || incomeBasis <= 0) {
    return 0;
  }

  const remainingAmount = targetAmount - currentBalance;
  if (remainingAmount <= 0) {
    return 0; // Goal already reached
  }

  const monthlyContributionNeeded = remainingAmount / targetMonths;
  const incomePercentage = (monthlyContributionNeeded / incomeBasis) * 100;

  return Math.max(0, Math.min(100, incomePercentage)); // Clamp between 0 and 100
}

/**
 * Calculate progress, ETA, and monthly contribution for a goal
 */
export function calculateProgress(
  goal: GoalForCalculation,
  incomeBasis: number
): {
  monthlyContribution: number;
  monthsToGoal: number | null;
  progressPct: number;
} {
  // If targetMonths is provided and incomePercentage is not set or 0, calculate it
  let effectiveIncomePercentage = goal.incomePercentage;
  if ((goal.targetMonths && goal.targetMonths > 0) && (!goal.incomePercentage || goal.incomePercentage === 0)) {
    effectiveIncomePercentage = calculateIncomePercentageFromTargetMonths(
      goal.targetAmount,
      goal.currentBalance,
      goal.targetMonths,
      incomeBasis
    );
  }

  // Calculate monthly contribution
  const monthlyContribution = goal.isPaused
    ? 0
    : incomeBasis * (effectiveIncomePercentage / 100);

  // Calculate progress percentage
  const progressPct = goal.targetAmount > 0
    ? Math.min((goal.currentBalance / goal.targetAmount) * 100, 100)
    : 0;

  // Calculate months to goal
  let monthsToGoal: number | null = null;
  if (!goal.isPaused && monthlyContribution > 0) {
    const remaining = goal.targetAmount - goal.currentBalance;
    if (remaining > 0) {
      monthsToGoal = remaining / monthlyContribution;
    } else if (remaining <= 0) {
      monthsToGoal = 0; // Goal already reached
    }
  }

  return {
    monthlyContribution,
    monthsToGoal,
    progressPct,
  };
}

