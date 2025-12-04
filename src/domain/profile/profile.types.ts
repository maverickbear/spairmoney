/**
 * Domain types for profile
 * Pure TypeScript types with no external dependencies
 */

import { ExpectedIncomeRange } from "../onboarding/onboarding.types";

export interface BaseProfile {
  name: string;
  email: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  temporaryExpectedIncome?: ExpectedIncomeRange | null;
  temporaryExpectedIncomeAmount?: number | null; // Exact numeric value when user provides custom amount
}

