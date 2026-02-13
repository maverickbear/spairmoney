/**
 * Onboarding Domain Validations
 * Zod schemas for onboarding feature
 */

import { z } from "zod";

/** Schema for expected annual household income (single free-form amount). */
export const expectedAnnualIncomeSchema = z
  .number()
  .positive("Expected income must be positive")
  .max(999_999_999, "Expected income is too large")
  .nullable()
  .optional();

export type ExpectedAnnualIncomeFormData = number | null | undefined;

// Simplified onboarding validations
export const userGoalSchema = z.enum([
  "track-spending",
  "save-money",
  "pay-debt",
  "plan-budget",
  "invest-wealth",
  "household-finance",
]);

export const householdTypeSchema = z.enum(["personal", "shared"]);

export const simplifiedOnboardingSchema = z.object({
  goals: z.array(userGoalSchema).min(1, "Please select at least one goal"),
  householdType: householdTypeSchema,
  expectedAnnualIncome: expectedAnnualIncomeSchema,
  location: z
    .object({
      country: z.string(),
      stateOrProvince: z.string().nullable(),
    })
    .nullable()
    .optional(),
});

export type SimplifiedOnboardingFormData = z.infer<typeof simplifiedOnboardingSchema>;

