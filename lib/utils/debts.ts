/**
 * Debt calculation utilities
 * These are pure functions that can be used on both client and server
 */

export interface DebtForCalculation {
  id: string;
  name: string;
  initialAmount: number;
  downPayment: number;
  currentBalance: number;
  interestRate: number; // Annual interest rate as percentage
  totalMonths: number | null;
  firstPaymentDate: string | Date;
  monthlyPayment: number;
  paymentFrequency?: string; // "monthly" | "biweekly" | "weekly" | "semimonthly" | "daily"
  paymentAmount?: number | null; // Payment amount based on frequency
  principalPaid: number;
  interestPaid: number;
  additionalContributions: boolean;
  additionalContributionAmount?: number | null;
  priority: "High" | "Medium" | "Low";
  isPaused: boolean;
  isPaidOff: boolean;
  description?: string | null;
}

/**
 * Convert payment amount to monthly equivalent based on frequency
 */
export function convertToMonthlyPayment(
  paymentAmount: number,
  frequency: "monthly" | "biweekly" | "weekly" | "semimonthly" | "daily"
): number {
  switch (frequency) {
    case "monthly":
      return paymentAmount;
    case "biweekly":
      // Biweekly: 2 payments per month (more intuitive than 26/12)
      return paymentAmount * 2;
    case "weekly":
      // Weekly: 52 payments per year = 52/12 = 4.3333 per month
      return paymentAmount * (52 / 12);
    case "semimonthly":
      // Semimonthly: 24 payments per year = 24/12 = 2 per month
      return paymentAmount * 2;
    case "daily":
      // Daily: 365 payments per year = 365/12 = 30.4167 per month
      return paymentAmount * (365 / 12);
    default:
      return paymentAmount;
  }
}

/**
 * Convert monthly payment to payment amount based on frequency
 */
export function convertFromMonthlyPayment(
  monthlyPayment: number,
  frequency: "monthly" | "biweekly" | "weekly" | "semimonthly" | "daily"
): number {
  switch (frequency) {
    case "monthly":
      return monthlyPayment;
    case "biweekly":
      // Biweekly: 2 payments per month (more intuitive than 26/12)
      return monthlyPayment / 2;
    case "weekly":
      // Weekly: 52 payments per year = 52/12 = 4.3333 per month
      return monthlyPayment / (52 / 12);
    case "semimonthly":
      // Semimonthly: 24 payments per year = 24/12 = 2 per month
      return monthlyPayment / 2;
    case "daily":
      // Daily: 365 payments per year = 365/12 = 30.4167 per month
      return monthlyPayment / (365 / 12);
    default:
      return monthlyPayment;
  }
}

/**
 * Calculate monthly payment (PMT) using amortization formula
 * PMT = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
 * where:
 * P = Principal (initialAmount - downPayment)
 * r = Monthly interest rate (annualRate / 100 / 12)
 * n = Number of months (totalMonths)
 */
export function calculateMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  totalMonths: number
): number {
  if (principal <= 0 || totalMonths <= 0) {
    return 0;
  }

  // If no interest, simple division
  if (annualInterestRate === 0) {
    return principal / totalMonths;
  }

  const monthlyInterestRate = getMonthlyInterestRate(annualInterestRate);
  
  // PMT formula: P * (r * (1 + r)^n) / ((1 + r)^n - 1)
  const onePlusR = 1 + monthlyInterestRate;
  const onePlusRToN = Math.pow(onePlusR, totalMonths);
  const numerator = monthlyInterestRate * onePlusRToN;
  const denominator = onePlusRToN - 1;
  
  if (denominator <= 0) {
    return 0;
  }
  
  const monthlyPayment = principal * (numerator / denominator);
  return Math.round(monthlyPayment * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate remaining balance
 */
export function calculateRemainingBalance(
  initialAmount: number,
  downPayment: number,
  principalPaid: number
): number {
  const principal = initialAmount - downPayment;
  return Math.max(0, principal - principalPaid);
}

/**
 * Calculate monthly interest rate from annual rate
 */
export function getMonthlyInterestRate(annualRate: number): number {
  return annualRate / 100 / 12;
}

/**
 * Calculate principal and interest distribution for a payment
 * Returns { principal: number, interest: number }
 */
export function calculatePaymentDistribution(
  paymentAmount: number,
  currentBalance: number,
  monthlyInterestRate: number
): { principal: number; interest: number } {
  const interest = currentBalance * monthlyInterestRate;
  const principal = Math.max(0, paymentAmount - interest);
  
  return {
    principal,
    interest: Math.min(interest, paymentAmount), // Interest cannot exceed payment
  };
}

/**
 * Calculate months remaining to pay off debt
 * Uses amortization formula with compound interest
 */
export function calculateMonthsRemaining(
  debt: DebtForCalculation
): number | null {
  if (debt.isPaidOff || debt.currentBalance <= 0) {
    return 0;
  }

  if (debt.isPaused) {
    return null; // Cannot calculate if paused
  }

  const monthlyInterestRate = getMonthlyInterestRate(debt.interestRate);
  
  // Calculate monthly payment - use paymentAmount if available, otherwise use monthlyPayment
  let monthlyPayment = debt.monthlyPayment;
  if (debt.paymentAmount && debt.paymentFrequency) {
    monthlyPayment = convertToMonthlyPayment(
      debt.paymentAmount,
      debt.paymentFrequency as "monthly" | "biweekly" | "weekly" | "semimonthly" | "daily"
    );
  }
  
  const additionalContribution = debt.additionalContributions && debt.additionalContributionAmount
    ? debt.additionalContributionAmount
    : 0;
  const totalMonthlyPayment = monthlyPayment + additionalContribution;

  if (totalMonthlyPayment <= 0) {
    return null; // Cannot calculate with zero payment
  }

  // If monthly payment is less than interest, debt will never be paid off
  const monthlyInterest = debt.currentBalance * monthlyInterestRate;
  if (totalMonthlyPayment <= monthlyInterest) {
    return null; // Debt will never be paid off with current payment
  }

  // Calculate months using amortization formula
  // n = -log(1 - (P * r) / M) / log(1 + r)
  // where:
  // n = number of months
  // P = principal (currentBalance)
  // r = monthly interest rate
  // M = monthly payment
  const principal = debt.currentBalance;
  const numerator = -Math.log(1 - (principal * monthlyInterestRate) / totalMonthlyPayment);
  const denominator = Math.log(1 + monthlyInterestRate);
  
  if (denominator <= 0 || numerator <= 0) {
    return null;
  }

  const monthsRemaining = Math.ceil(numerator / denominator);
  return Math.max(0, monthsRemaining);
}

/**
 * Calculate total interest remaining (estimated)
 */
export function calculateTotalInterestRemaining(
  debt: DebtForCalculation
): number {
  if (debt.isPaidOff || debt.currentBalance <= 0) {
    return 0;
  }

  const monthsRemaining = calculateMonthsRemaining(debt);
  if (monthsRemaining === null || monthsRemaining <= 0) {
    return 0;
  }

  const monthlyInterestRate = getMonthlyInterestRate(debt.interestRate);
  let totalInterest = 0;
  let balance = debt.currentBalance;
  const monthlyPayment = debt.monthlyPayment;
  const additionalContribution = debt.additionalContributions && debt.additionalContributionAmount
    ? debt.additionalContributionAmount
    : 0;
  const totalMonthlyPayment = monthlyPayment + additionalContribution;

  // Estimate interest by calculating month by month
  for (let i = 0; i < monthsRemaining && balance > 0; i++) {
    const interest = balance * monthlyInterestRate;
    totalInterest += interest;
    const principal = Math.min(balance, totalMonthlyPayment - interest);
    balance -= principal;
  }

  return Math.max(0, totalInterest);
}

/**
 * Calculate progress percentage (how much principal has been paid)
 */
export function calculateProgressPct(
  initialAmount: number,
  downPayment: number,
  principalPaid: number
): number {
  const principal = initialAmount - downPayment;
  if (principal <= 0) {
    return 100;
  }
  
  const totalPaid = downPayment + principalPaid;
  return Math.min((totalPaid / initialAmount) * 100, 100);
}

/**
 * Calculate payments made based on first payment date
 * Returns { principalPaid, interestPaid, currentBalance, monthsPaid }
 */
export function calculatePaymentsFromDate(
  debt: DebtForCalculation,
  currentDate: Date = new Date()
): {
  principalPaid: number;
  interestPaid: number;
  currentBalance: number;
  monthsPaid: number;
} {
  if (debt.isPaidOff || debt.isPaused) {
    return {
      principalPaid: debt.principalPaid,
      interestPaid: debt.interestPaid,
      currentBalance: debt.currentBalance,
      monthsPaid: 0,
    };
  }

  // Parse first payment date
  const firstPaymentDate = typeof debt.firstPaymentDate === 'string'
    ? new Date(debt.firstPaymentDate)
    : debt.firstPaymentDate instanceof Date
    ? debt.firstPaymentDate
    : new Date(debt.firstPaymentDate);

  // Reset time to start of day for accurate month calculation
  const firstPayment = new Date(firstPaymentDate.getFullYear(), firstPaymentDate.getMonth(), 1);
  const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  // Calculate how many months have passed since first payment
  // This counts the months where payments should have been made
  const monthsDiff = Math.floor(
    (current.getFullYear() - firstPayment.getFullYear()) * 12 +
    (current.getMonth() - firstPayment.getMonth())
  );

  // If first payment is in the future, return initial state
  if (monthsDiff < 0) {
    const initialBalance = debt.initialAmount - debt.downPayment;
    return {
      principalPaid: 0,
      interestPaid: 0,
      currentBalance: initialBalance,
      monthsPaid: 0,
    };
  }

  const monthlyInterestRate = getMonthlyInterestRate(debt.interestRate);
  
  // Calculate monthly payment - use paymentAmount if available, otherwise use monthlyPayment
  let monthlyPayment = debt.monthlyPayment;
  if (debt.paymentAmount && debt.paymentFrequency) {
    monthlyPayment = convertToMonthlyPayment(
      debt.paymentAmount,
      debt.paymentFrequency as "monthly" | "biweekly" | "weekly" | "semimonthly" | "daily"
    );
  }
  
  const additionalContribution = debt.additionalContributions && debt.additionalContributionAmount
    ? debt.additionalContributionAmount
    : 0;
  const totalMonthlyPayment = monthlyPayment + additionalContribution;

  // Start with initial principal (after down payment)
  let balance = debt.initialAmount - debt.downPayment;
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  
  // Limit to total months of the loan (if null, use monthsDiff for revolving credit)
  const monthsToCalculate = debt.totalMonths !== null && debt.totalMonths > 0
    ? Math.min(monthsDiff, debt.totalMonths)
    : monthsDiff;

  // Calculate month by month amortization
  for (let month = 0; month < monthsToCalculate && balance > 0; month++) {
    // Calculate interest for this month
    const interest = balance * monthlyInterestRate;
    
    // Calculate principal payment (payment minus interest)
    const principal = Math.min(balance, totalMonthlyPayment - interest);
    
    // Update totals
    totalInterestPaid += interest;
    totalPrincipalPaid += principal;
    balance -= principal;

    // If balance goes to zero, stop
    if (balance <= 0) {
      break;
    }
  }

  return {
    principalPaid: Math.round(totalPrincipalPaid * 100) / 100, // Round to 2 decimals
    interestPaid: Math.round(totalInterestPaid * 100) / 100,
    currentBalance: Math.max(0, Math.round(balance * 100) / 100),
    monthsPaid: monthsToCalculate,
  };
}

/**
 * Calculate all debt metrics
 */
export function calculateDebtMetrics(
  debt: DebtForCalculation
): {
  remainingBalance: number;
  remainingPrincipal: number;
  monthsRemaining: number | null;
  totalInterestPaid: number;
  totalInterestRemaining: number;
  progressPct: number;
} {
  // Calculate payments based on date
  const calculatedPayments = calculatePaymentsFromDate(debt);
  
  // Always use calculated values (they're based on actual date progression)
  const effectivePrincipalPaid = calculatedPayments.principalPaid;
  const effectiveInterestPaid = calculatedPayments.interestPaid;
  const effectiveCurrentBalance = calculatedPayments.currentBalance;

  const remainingBalance = calculateRemainingBalance(
    debt.initialAmount,
    debt.downPayment,
    effectivePrincipalPaid
  );

  const remainingPrincipal = debt.initialAmount - debt.downPayment - effectivePrincipalPaid;
  
  // Create updated debt for remaining calculations
  const updatedDebt: DebtForCalculation = {
    ...debt,
    currentBalance: effectiveCurrentBalance,
    principalPaid: effectivePrincipalPaid,
    interestPaid: effectiveInterestPaid,
  };

  const monthsRemaining = calculateMonthsRemaining(updatedDebt);
  const totalInterestRemaining = calculateTotalInterestRemaining(updatedDebt);
  const progressPct = calculateProgressPct(
    debt.initialAmount,
    debt.downPayment,
    effectivePrincipalPaid
  );

  return {
    remainingBalance,
    remainingPrincipal: Math.max(0, remainingPrincipal),
    monthsRemaining,
    totalInterestPaid: effectiveInterestPaid,
    totalInterestRemaining,
    progressPct,
  };
}

/**
 * Calculate next payment dates for a debt based on payment frequency
 * Returns array of upcoming payment dates within the next month
 */
export function calculateNextPaymentDates(
  debt: DebtForCalculation,
  startDate: Date = new Date(),
  endDate?: Date
): Array<{ date: Date; amount: number }> {
  // If debt is paid off or paused, return empty array
  if (debt.isPaidOff || debt.isPaused || debt.currentBalance <= 0) {
    return [];
  }

  // Parse first payment date
  const firstPaymentDate = typeof debt.firstPaymentDate === 'string'
    ? new Date(debt.firstPaymentDate)
    : debt.firstPaymentDate instanceof Date
    ? debt.firstPaymentDate
    : new Date(debt.firstPaymentDate);

  // Get payment amount and frequency
  const paymentFrequency = debt.paymentFrequency || "monthly";
  const paymentAmount = debt.paymentAmount || debt.monthlyPayment;

  if (!paymentAmount || paymentAmount <= 0) {
    return [];
  }

  // Set default end date to 1 month from start
  const defaultEndDate = new Date(startDate);
  defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);
  const limitDate = endDate || defaultEndDate;

  // Normalize dates to start of day
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(limitDate);
  end.setHours(23, 59, 59, 999);
  const firstPayment = new Date(firstPaymentDate);
  firstPayment.setHours(0, 0, 0, 0);

  const payments: Array<{ date: Date; amount: number }> = [];

  // Calculate next payment date based on frequency
  // Use the exact date from firstPaymentDate (not just first of month)
  let currentPaymentDate = new Date(firstPaymentDate);
  currentPaymentDate.setHours(0, 0, 0, 0);

  // If first payment is in the past, calculate the next occurrence
  if (currentPaymentDate < start) {
    // Calculate how many periods have passed
    const periodsPassed = calculatePeriodsPassed(currentPaymentDate, start, paymentFrequency);
    
    // Advance by the number of periods passed + 1 to get the next payment
    for (let i = 0; i <= periodsPassed; i++) {
      currentPaymentDate = getNextPaymentDate(currentPaymentDate, paymentFrequency);
    }
  }

  // If the calculated date is before start, advance to the next period
  while (currentPaymentDate < start) {
    currentPaymentDate = getNextPaymentDate(currentPaymentDate, paymentFrequency);
  }

  // Generate all payments within the date range
  while (currentPaymentDate <= end) {
    payments.push({
      date: new Date(currentPaymentDate),
      amount: paymentAmount,
    });
    currentPaymentDate = getNextPaymentDate(currentPaymentDate, paymentFrequency);
    
    // Safety limit to prevent infinite loops
    if (payments.length > 100) {
      break;
    }
  }

  return payments;
}

/**
 * Get the next payment date based on frequency
 */
function getNextPaymentDate(
  currentDate: Date,
  frequency: string
): Date {
  const next = new Date(currentDate);
  
  switch (frequency) {
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "semimonthly":
      // Semimonthly: 1st and 15th of each month
      if (next.getDate() <= 15) {
        // If we're on or before the 15th, next payment is on the 15th
        if (next.getDate() < 15) {
          next.setDate(15);
        } else {
          // If we're on the 15th, next payment is on the 1st of next month
          next.setMonth(next.getMonth() + 1);
          next.setDate(1);
        }
      } else {
        // If we're after the 15th, next payment is on the 1st of next month
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
      }
      break;
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  
  return next;
}

/**
 * Calculate how many payment periods have passed between two dates
 */
function calculatePeriodsPassed(
  startDate: Date,
  endDate: Date,
  frequency: string
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  
  switch (frequency) {
    case "monthly":
      return Math.floor(
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth())
      );
    case "biweekly":
      return Math.floor(diffTime / (14 * 24 * 60 * 60 * 1000));
    case "weekly":
      return Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
    case "semimonthly":
      // Approximate: 2 periods per month
      return Math.floor(
        ((end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth())) * 2
      );
    case "daily":
      return Math.floor(diffTime / (24 * 60 * 60 * 1000));
    default:
      return Math.floor(
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth())
      );
  }
}

/**
 * Get the next occurrence of a given day of month (1–31).
 * Used for credit card due dates. Clamps to last day of month when needed (e.g. day 31 in Feb).
 */
export function getNextDueDateFromDayOfMonth(
  dayOfMonth: number,
  fromDate: Date = new Date()
): Date {
  if (dayOfMonth < 1 || dayOfMonth > 31) {
    const next = new Date(fromDate);
    next.setMonth(next.getMonth() + 1);
    next.setDate(1);
    return next;
  }
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);
  const year = start.getFullYear();
  const month = start.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(dayOfMonth, lastDay);
  const candidate = new Date(year, month, day);
  candidate.setHours(0, 0, 0, 0);
  if (candidate > start) {
    return candidate;
  }
  const nextMonth = new Date(year, month + 1, 1);
  const nextLastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
  const nextDay = Math.min(dayOfMonth, nextLastDay);
  return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextDay);
}

