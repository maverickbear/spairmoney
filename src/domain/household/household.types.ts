/**
 * Household Domain Types
 * Pure domain types for household feature
 */

import { ExpectedIncomeRange } from "../onboarding/onboarding.types";

export interface HouseholdSettings {
  expectedIncome?: ExpectedIncomeRange;
  expectedIncomeAmount?: number | null; // Exact numeric value when user provides custom amount
}

