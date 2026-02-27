/**
 * Onboarding Mapper
 * Maps household settings JSONB ↔ domain types
 */

import { HouseholdSettings } from "../../domain/household/household.types";
import { BudgetRuleType } from "../../domain/budgets/budget-rules.types";
import type { ExpectedIncomeRange } from "../../domain/onboarding/onboarding.types";

/** Legacy: range midpoint in annual terms (for reading old data only). */
const RANGE_TO_ANNUAL: Record<NonNullable<ExpectedIncomeRange>, number> = {
  "0-50k": 25_000,
  "50k-100k": 75_000,
  "100k-150k": 125_000,
  "150k-250k": 200_000,
  "250k+": 300_000,
};

export class OnboardingMapper {
  /**
   * Map database settings JSONB to domain HouseholdSettings.
   * Reads expectedAnnualIncome; falls back to legacy expectedIncomeAmount or expectedIncome range.
   */
  static settingsToDomain(settings: Record<string, unknown> | null): HouseholdSettings {
    if (!settings) {
      return {};
    }

    let expectedAnnualIncome: number | null | undefined;
    if (typeof settings.expectedAnnualIncome === "number" && settings.expectedAnnualIncome > 0) {
      expectedAnnualIncome = settings.expectedAnnualIncome;
    } else if (typeof settings.expectedIncomeAmount === "number" && settings.expectedIncomeAmount > 0) {
      expectedAnnualIncome = settings.expectedIncomeAmount;
    } else {
      const rangeKey = settings.expectedIncome;
      if (typeof rangeKey === "string" && rangeKey in RANGE_TO_ANNUAL) {
        expectedAnnualIncome = RANGE_TO_ANNUAL[rangeKey as NonNullable<ExpectedIncomeRange>];
      } else {
        expectedAnnualIncome = undefined;
      }
    }

    const rawMemberIncomes = settings.memberIncomes ?? settings.member_incomes;
    const memberIncomes =
      rawMemberIncomes != null &&
      typeof rawMemberIncomes === "object" &&
      !Array.isArray(rawMemberIncomes)
        ? (Object.fromEntries(
            Object.entries(rawMemberIncomes).filter(
              (entry): entry is [string, number] =>
                typeof entry[0] === "string" && typeof entry[1] === "number" && entry[1] >= 0
            )
          ) as Record<string, number>)
        : undefined;

    return {
      ...(expectedAnnualIncome !== undefined && { expectedAnnualIncome }),
      ...(memberIncomes !== undefined && { memberIncomes }),
      country: typeof settings.country === "string" ? settings.country : undefined,
      stateOrProvince:
        typeof settings.stateOrProvince === "string" ? settings.stateOrProvince : undefined,
      budgetRule: (settings.budgetRule as BudgetRuleType) || undefined,
      onboardingCompletedAt:
        typeof settings.onboardingCompletedAt === "string"
          ? settings.onboardingCompletedAt
          : undefined,
      onboardingGoals: Array.isArray(settings.onboardingGoals)
        ? (settings.onboardingGoals as string[])
        : undefined,
      onboardingHouseholdType:
        settings.onboardingHouseholdType === "personal" ||
        settings.onboardingHouseholdType === "shared"
          ? settings.onboardingHouseholdType
          : undefined,
      displayCurrency:
        typeof settings.displayCurrency === "string" && settings.displayCurrency.length === 3
          ? (settings.displayCurrency as string).toUpperCase()
          : undefined,
    };
  }

  /**
   * Map domain HouseholdSettings to database JSONB format.
   * Writes only expectedAnnualIncome for income.
   */
  static settingsToDatabase(
    settings: HouseholdSettings & Record<string, unknown>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (settings.expectedAnnualIncome !== undefined) {
      result.expectedAnnualIncome = settings.expectedAnnualIncome;
    }
    if (
      settings.memberIncomes !== undefined &&
      settings.memberIncomes !== null &&
      typeof settings.memberIncomes === "object"
    ) {
      result.memberIncomes = settings.memberIncomes;
    }

    if (settings.country !== undefined) {
      result.country = settings.country;
    }
    if (settings.stateOrProvince !== undefined) {
      result.stateOrProvince = settings.stateOrProvince;
    }
    if (settings.budgetRule !== undefined) {
      result.budgetRule = settings.budgetRule;
    }
    if (settings.onboardingCompletedAt !== undefined) {
      result.onboardingCompletedAt = settings.onboardingCompletedAt;
    }
    if (settings.onboardingGoals !== undefined) {
      result.onboardingGoals = settings.onboardingGoals;
    }
    if (settings.onboardingHouseholdType !== undefined) {
      result.onboardingHouseholdType = settings.onboardingHouseholdType;
    }
    if (settings.displayCurrency !== undefined) {
      result.displayCurrency = settings.displayCurrency;
    }

    Object.keys(settings).forEach((key) => {
      if (
        ![
          "expectedAnnualIncome",
          "memberIncomes",
          "country",
          "stateOrProvince",
          "budgetRule",
          "onboardingCompletedAt",
          "onboardingGoals",
          "onboardingHouseholdType",
          "displayCurrency",
        ].includes(key)
      ) {
        result[key] = settings[key];
      }
    });

    return result;
  }
}

