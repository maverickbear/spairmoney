/**
 * Helper functions for transaction calculations in the dashboard
 * Re-exports from centralized service layer for backward compatibility
 */

export {
  parseAmount as parseTransactionAmount,
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateNetAmount,
  groupExpensesByCategory,
  calculateSavingsRate,
  calculateExpenseRatio,
  calculateTransactionSummary,
} from '@/lib/services/transaction-calculations';

