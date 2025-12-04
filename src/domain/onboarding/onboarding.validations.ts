/**
 * Onboarding Domain Validations
 * Zod schemas for onboarding feature
 */

import { z } from "zod";
import { ExpectedIncomeRange } from "./onboarding.types";

export const expectedIncomeRangeSchema = z.enum([
  "0-50k",
  "50k-100k",
  "100k-150k",
  "150k-250k",
  "250k+",
]).nullable();

export const expectedIncomeAmountSchema = z.number().positive("Expected income amount must be positive").nullable().optional();

export type ExpectedIncomeRangeFormData = z.infer<typeof expectedIncomeRangeSchema>;

export interface ExpectedIncomeFormData {
  incomeRange: ExpectedIncomeRange;
  incomeAmount?: number | null; // Optional custom amount
}

