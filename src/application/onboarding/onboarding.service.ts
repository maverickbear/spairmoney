/**
 * Onboarding Service
 * Business logic for onboarding feature
 */

import { HouseholdRepository } from "@/src/infrastructure/database/repositories/household.repository";
import { OnboardingMapper } from "./onboarding.mapper";
import { OnboardingStatusExtended } from "../../domain/onboarding/onboarding.types";
import { expectedAnnualIncomeSchema } from "../../domain/onboarding/onboarding.validations";
import { locationSchema } from "../../domain/taxes/taxes.validations";
import { getActiveHouseholdId } from "@/lib/utils/household";
import { logger } from "@/src/infrastructure/utils/logger";
import { BudgetGenerator } from "./budget-generator";
import { CategoryHelper } from "./category-helper";
import { FinancialHealthData } from "../shared/financial-health";
import {
  penaltyCashFlow,
  penaltyEmergencyFund,
  penaltySavings,
  penaltyStability,
  getClassificationFromScore,
} from "../shared/spair-score-calculator";
// CRITICAL: Use static import to ensure React cache() works correctly
import { getAccountsForDashboard } from "../accounts/get-dashboard-accounts";
import { makeProfileService } from "../profile/profile.factory";
import { getDashboardSubscription } from "../subscriptions/get-dashboard-subscription";
import { AppError } from "../shared/app-error";

export class OnboardingService {
  constructor(
    private householdRepository: HouseholdRepository,
    private budgetGenerator: BudgetGenerator,
    private categoryHelper: CategoryHelper
  ) {}

  /**
   * Get complete onboarding status including accounts, profile, and income
   * OPTIMIZED: Can skip subscription check for faster response
   */
  async getOnboardingStatus(
    userId: string,
    accessToken?: string,
    refreshToken?: string,
    options?: { skipSubscriptionCheck?: boolean; subscriptionData?: Awaited<ReturnType<typeof getDashboardSubscription>> }
  ): Promise<OnboardingStatusExtended> {
    try {
      // OPTIMIZATION: Run checks in parallel for faster response
      const [accountsResult, profileResult, incomeResult] = await Promise.all([
        // Check accounts
        (async () => {
          try {
            // CRITICAL: Use cached getAccountsForDashboard to avoid duplicate calls
            // Using static import ensures React cache() works correctly
            const accounts = await getAccountsForDashboard(false);
            const hasAccount = accounts.length > 0;
            const totalBalance = hasAccount
              ? accounts.reduce((sum: number, acc: { balance?: number }) => sum + (acc.balance || 0), 0)
              : undefined;
            return { hasAccount, totalBalance, accounts };
          } catch (error) {
            logger.warn("[OnboardingService] Error checking accounts:", error);
            return { hasAccount: false, totalBalance: undefined, accounts: [] };
          }
        })(),
        // Check profile
        (async () => {
          try {
            const profileService = makeProfileService();
            const profile = await profileService.getProfile(accessToken, refreshToken);
            const hasCompleteProfile = profile !== null && profile.name !== null && profile.name.trim() !== "";
            const hasPersonalData = profile !== null && 
              profile.phoneNumber !== null && 
              profile.phoneNumber !== undefined && 
              profile.phoneNumber.trim() !== "" &&
              profile.dateOfBirth !== null && 
              profile.dateOfBirth !== undefined && 
              profile.dateOfBirth.trim() !== "";
            return { hasCompleteProfile, hasPersonalData, profile };
          } catch (error) {
            logger.warn("[OnboardingService] Error checking profile:", error);
            return { hasCompleteProfile: false, hasPersonalData: false, profile: null };
          }
        })(),
        // Check income onboarding status
        this.checkIncomeOnboardingStatus(userId, accessToken, refreshToken).catch(() => false),
      ]);

      const { hasAccount, totalBalance } = accountsResult;
      const { hasCompleteProfile, hasPersonalData } = profileResult;
      const hasExpectedIncome = incomeResult;

      // OPTIMIZATION: Skip subscription check if requested (for faster dialog opening)
      let hasPlan = false;
      if (!options?.skipSubscriptionCheck) {
        try {
          // CRITICAL OPTIMIZATION: Use pre-loaded subscription data if provided
          // Otherwise use cached getDashboardSubscription to avoid duplicate calls
          let subscriptionData;
          
          if (options?.subscriptionData) {
            // Use pre-loaded subscription data (from layout/context)
            subscriptionData = options.subscriptionData;
          } else {
            // Use cached function (ensures only 1 SubscriptionsService call per request)
            // Pass userId to avoid calling getCurrentUserId() (which uses cookies()) inside cache scope
            subscriptionData = await getDashboardSubscription(userId);
          }
          
          hasPlan = subscriptionData?.plan !== null && 
                   subscriptionData?.subscription !== null &&
                   (subscriptionData.subscription.status === "active" || 
                    subscriptionData.subscription.status === "trialing");
        } catch (error) {
          // If subscription check fails, assume no plan (will show onboarding)
          logger.warn("[OnboardingService] Subscription check failed, assuming no plan:", error);
          hasPlan = false;
        }
      }

      // Calculate counts - simplified onboarding: personal data, income (2 steps)
      // Note: hasPlan is no longer part of onboarding completion criteria
      // Onboarding completion is now determined by onboardingCompletedAt flag in household settings
      const completedCount = [hasPersonalData, hasExpectedIncome].filter(Boolean).length;
      const totalCount = 2;

      return {
        hasAccount,
        hasCompleteProfile,
        hasPersonalData,
        hasExpectedIncome,
        hasPlan,
        completedCount,
        totalCount,
        totalBalance,
      };
    } catch (error) {
      logger.error("[OnboardingService] Error getting onboarding status:", error);
      // Return default status on error
      return {
        hasAccount: false,
        hasCompleteProfile: false,
        hasPersonalData: false,
        hasExpectedIncome: false,
        hasPlan: false,
        completedCount: 0,
        totalCount: 2,
      };
    }
  }

  /**
   * Check if user has completed income onboarding
   * Checks household settings first, then falls back to temporary income in profile
   */
  async checkIncomeOnboardingStatus(
    userId: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<boolean> {
    try {
      const householdId = await getActiveHouseholdId(userId, accessToken, refreshToken);

      if (householdId) {
        const settings = await this.householdRepository.getSettings(
          householdId,
          accessToken,
          refreshToken
        );
        if (
          settings?.expectedAnnualIncome !== undefined &&
          settings.expectedAnnualIncome !== null &&
          settings.expectedAnnualIncome > 0
        ) {
          return true;
        }
      }

      const profileService = makeProfileService();
      const profile = await profileService.getProfile(accessToken, refreshToken);
      const hasTemporary =
        profile?.temporaryExpectedIncomeAmount !== undefined &&
        profile.temporaryExpectedIncomeAmount !== null &&
        profile.temporaryExpectedIncomeAmount > 0;
      return hasTemporary;
    } catch (error) {
      logger.error("[OnboardingService] Error checking income onboarding status:", error);
      return false;
    }
  }

  /**
   * Save expected annual income.
   * If householdId is provided and user has access, save to that household; otherwise use active household or temporary profile.
   * When memberIncomes is provided, it is persisted and expectedAnnualIncome is set to the sum of values (or to expectedAnnualIncome if provided).
   */
  async saveExpectedIncome(
    userId: string,
    expectedAnnualIncome: number | null,
    accessToken?: string,
    refreshToken?: string,
    householdIdParam?: string | null,
    memberIncomes?: Record<string, number> | null
  ): Promise<void> {
    const totalFromMembers =
      memberIncomes != null
        ? Object.values(memberIncomes).reduce((sum, v) => sum + (typeof v === "number" ? v : 0), 0)
        : null;
    const effectiveTotal =
      totalFromMembers != null && totalFromMembers > 0
        ? totalFromMembers
        : expectedAnnualIncome;

    if (effectiveTotal !== null && effectiveTotal !== undefined) {
      expectedAnnualIncomeSchema.parse(effectiveTotal);
      if (effectiveTotal <= 0) {
        throw new AppError("Expected income must be positive", 400);
      }
    }

    const householdId =
      householdIdParam ?? (await getActiveHouseholdId(userId, accessToken, refreshToken));

    if (!householdId) {
      logger.info(
        `[OnboardingService] No household found for user ${userId}, storing income temporarily in profile`
      );
      const profileService = makeProfileService();
      await profileService.updateProfile({
        temporaryExpectedIncome: null,
        temporaryExpectedIncomeAmount: effectiveTotal ?? expectedAnnualIncome,
      });
      logger.info(
        `[OnboardingService] Stored temporary expected income for user ${userId}: ${effectiveTotal ?? expectedAnnualIncome ?? "null"}`
      );
      return;
    }

    const currentSettings = await this.householdRepository.getSettings(
      householdId,
      accessToken,
      refreshToken
    );

    const updatedSettings = OnboardingMapper.settingsToDatabase({
      ...currentSettings,
      expectedAnnualIncome: effectiveTotal ?? expectedAnnualIncome ?? undefined,
      ...(memberIncomes != null && { memberIncomes }),
    });

    await this.householdRepository.updateSettings(
      householdId,
      updatedSettings,
      accessToken,
      refreshToken
    );

    logger.info(
      `[OnboardingService] Saved expected income for user ${userId}, household ${householdId}: ${effectiveTotal ?? expectedAnnualIncome ?? "null"}${memberIncomes != null ? " (per-member)" : ""}`
    );
  }

  /**
   * Mark onboarding as completed for a user
   * Sets onboardingCompletedAt timestamp in household settings
   */
  async markOnboardingComplete(
    userId: string,
    householdId: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<void> {
    try {
      // Get current settings
      const currentSettings = await this.householdRepository.getSettings(
        householdId,
        accessToken,
        refreshToken
      );

      if (!currentSettings) {
        throw new AppError("Household settings not found", 400);
      }

      // Update settings with completion timestamp
      const updatedSettings = OnboardingMapper.settingsToDatabase({
        ...currentSettings,
        onboardingCompletedAt: new Date().toISOString(),
      });

      await this.householdRepository.updateSettings(
        householdId,
        updatedSettings,
        accessToken,
        refreshToken
      );

      logger.info(`[OnboardingService] Marked onboarding as complete for user ${userId}`, {
        userId,
        householdId,
        completedAt: updatedSettings.onboardingCompletedAt,
      });
    } catch (error) {
      logger.error("[OnboardingService] Error marking onboarding as complete:", error);
      throw new AppError(
        "Failed to mark onboarding as complete",
        500
      );
    }
  }

  /**
   * Check if user has completed onboarding data (goals and householdType)
   * Used to determine if onboarding should be marked as complete
   */
  async checkHasOnboardingData(
    userId: string,
    householdId: string | null,
    accessToken?: string,
    refreshToken?: string
  ): Promise<boolean> {
    if (!householdId) {
      return false;
    }

    try {
      const settings = await this.householdRepository.getSettings(
        householdId,
        accessToken,
        refreshToken
      );

      if (!settings) {
        return false;
      }

      // Check if user has goals and householdType saved
      const hasGoals = Array.isArray(settings.onboardingGoals) && settings.onboardingGoals.length > 0;
      const hasHouseholdType = settings.onboardingHouseholdType === "personal" || settings.onboardingHouseholdType === "shared";

      return hasGoals && hasHouseholdType;
    } catch (error) {
      logger.warn("[OnboardingService] Error checking onboarding data:", error);
      return false;
    }
  }

  /**
   * Save location (country and state/province) to household settings
   * If no household exists, this will fail (location must be saved to household)
   */
  async saveLocation(
    userId: string,
    country: string,
    stateOrProvince: string | null,
    accessToken?: string,
    refreshToken?: string
  ): Promise<void> {
    // Validate input
    locationSchema.parse({ country, stateOrProvince });

    const householdId = await getActiveHouseholdId(userId, accessToken, refreshToken);
    
    if (!householdId) {
      throw new AppError("Household must exist to save location", 400);
    }

    // Get current settings
    const currentSettings = await this.householdRepository.getSettings(
      householdId,
      accessToken,
      refreshToken
    );

    // Update settings
    const updatedSettings = OnboardingMapper.settingsToDatabase({
      ...currentSettings,
      country,
      stateOrProvince,
    });

    await this.householdRepository.updateSettings(
      householdId,
      updatedSettings,
      accessToken,
      refreshToken
    );

    logger.info(`[OnboardingService] Saved location for user ${userId}: ${country}${stateOrProvince ? `, ${stateOrProvince}` : ''}`);
  }

  /**
   * Get location from household settings
   */
  async getLocation(
    userId: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<{ country: string | null; stateOrProvince: string | null }> {
    const householdId = await getActiveHouseholdId(userId, accessToken, refreshToken);
    
    if (!householdId) {
      return { country: null, stateOrProvince: null };
    }

    const settings = await this.householdRepository.getSettings(
      householdId,
      accessToken,
      refreshToken
    );

    return {
      country: settings?.country ?? null,
      stateOrProvince: settings?.stateOrProvince ?? null,
    };
  }

  /**
   * Get expected annual income for a specific household (by id).
   */
  async getExpectedIncomeForHousehold(
    householdId: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<number | null> {
    const settings = await this.householdRepository.getSettings(
      householdId,
      accessToken,
      refreshToken
    );
    const amount = settings?.expectedAnnualIncome;
    return amount != null && amount > 0 ? amount : null;
  }

  /**
   * Get income data for a household: total and per-member incomes (for the income edit dialog).
   */
  async getIncomeDataForHousehold(
    householdId: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<{ expectedAnnualIncome: number | null; memberIncomes: Record<string, number> }> {
    const settings = await this.householdRepository.getSettings(
      householdId,
      accessToken,
      refreshToken
    );
    const expectedAnnualIncome =
      settings?.expectedAnnualIncome != null && settings.expectedAnnualIncome > 0
        ? settings.expectedAnnualIncome
        : null;
    const memberIncomes = settings?.memberIncomes ?? {};
    return { expectedAnnualIncome, memberIncomes };
  }

  /**
   * Get expected annual income for the dashboard based on current view.
   * - When viewAsUserId is set: returns that member's expected income (uses householdId or active household).
   * - When householdId is set and viewAsUserId is not set: returns household total (Everyone in that household).
   * - When neither applies: returns sum across all user's households (Everyone).
   */
  async getExpectedIncomeForDashboardView(
    userId: string,
    householdId: string | null | undefined,
    viewAsUserId: string | null | undefined,
    accessToken?: string,
    refreshToken?: string
  ): Promise<number | null> {
    if (viewAsUserId) {
      const effectiveHouseholdId =
        householdId && householdId !== ""
          ? householdId
          : await getActiveHouseholdId(userId, accessToken, refreshToken);
      if (effectiveHouseholdId) {
        const { memberIncomes } = await this.getIncomeDataForHousehold(
          effectiveHouseholdId,
          accessToken,
          refreshToken
        );
        const amount = memberIncomes[viewAsUserId];
        return typeof amount === "number" && amount >= 0 ? amount : null;
      }
    }
    if (householdId && householdId !== "") {
      return this.getExpectedIncomeForHousehold(householdId, accessToken, refreshToken);
    }
    const sum = await this.getExpectedIncomeSumForUser(userId, accessToken, refreshToken);
    return sum > 0 ? sum : null;
  }

  /**
   * Get expected annual income for the user's active household (or temporary profile if no household).
   */
  async getExpectedIncomeAmount(
    userId: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<number | null> {
    const householdId = await getActiveHouseholdId(userId, accessToken, refreshToken);

    if (householdId) {
      const amount = await this.getExpectedIncomeForHousehold(
        householdId,
        accessToken,
        refreshToken
      );
      if (amount != null) return amount;
    }

    const profileService = makeProfileService();
    const profile = await profileService.getProfile(accessToken, refreshToken);
    const temp = profile?.temporaryExpectedIncomeAmount;
    return temp != null && temp > 0 ? temp : null;
  }

  /**
   * Get sum of expected annual income across all households the user belongs to.
   * Used for dashboard "Everyone" view.
   */
  async getExpectedIncomeSumForUser(
    userId: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<number> {
    const households = await this.householdRepository.findHouseholdsForUser(
      userId,
      accessToken,
      refreshToken
    );
    let sum = 0;
    for (const h of households) {
      const amount = await this.getExpectedIncomeForHousehold(h.id, accessToken, refreshToken);
      if (amount != null && amount > 0) sum += amount;
    }
    return sum;
  }

  /**
   * Convert expected annual income to monthly.
   */
  getMonthlyIncomeFromAnnual(expectedAnnualIncome: number | null): number {
    if (expectedAnnualIncome == null || expectedAnnualIncome <= 0) return 0;
    return expectedAnnualIncome / 12;
  }

  /**
   * Save budget rule to household settings
   */
  async saveBudgetRule(
    userId: string,
    ruleType: import("../../domain/budgets/budget-rules.types").BudgetRuleType,
    accessToken?: string,
    refreshToken?: string
  ): Promise<void> {
    const householdId = await getActiveHouseholdId(userId, accessToken, refreshToken);
    
    if (!householdId) {
      throw new AppError("Household must exist to save budget rule", 400);
    }

    // Get current settings
    const currentSettings = await this.householdRepository.getSettings(
      householdId,
      accessToken,
      refreshToken
    );

    // Update settings
    const updatedSettings = OnboardingMapper.settingsToDatabase({
      ...currentSettings,
      budgetRule: ruleType,
    });

    await this.householdRepository.updateSettings(
      householdId,
      updatedSettings,
      accessToken,
      refreshToken
    );

    logger.info(`[OnboardingService] Saved budget rule for user ${userId}: ${ruleType}`);
  }

  /**
   * Get budget rule from household settings
   */
  async getBudgetRule(
    userId: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<import("../../domain/budgets/budget-rules.types").BudgetRuleType | null> {
    const householdId = await getActiveHouseholdId(userId, accessToken, refreshToken);
    
    if (!householdId) {
      return null;
    }

    const settings = await this.householdRepository.getSettings(
      householdId,
      accessToken,
      refreshToken
    );

    return settings?.budgetRule ?? null;
  }

  /**
   * Generate initial budgets based on expected annual income and optional budget rule
   */
  async generateInitialBudgets(
    userId: string,
    expectedAnnualIncome: number,
    accessToken?: string,
    refreshToken?: string,
    ruleType?: import("../../domain/budgets/budget-rules.types").BudgetRuleType
  ): Promise<void> {
    if (expectedAnnualIncome <= 0) {
      throw new AppError("Expected income is required to generate budgets", 400);
    }

    const monthlyIncome = this.getMonthlyIncomeFromAnnual(expectedAnnualIncome);

    // Get location if available
    const householdId = await getActiveHouseholdId(userId, accessToken, refreshToken);
    let country: string | null = null;
    let stateOrProvince: string | null = null;
    
    if (householdId) {
      const settings = await this.householdRepository.getSettings(
        householdId,
        accessToken,
        refreshToken
      );
      country = settings?.country ?? null;
      stateOrProvince = settings?.stateOrProvince ?? null;
    }

    await this.budgetGenerator.generateInitialBudgets(
      userId,
      monthlyIncome,
      accessToken,
      refreshToken,
      ruleType,
      country,
      stateOrProvince
    );

    logger.info(`[OnboardingService] Generated initial budgets for user ${userId}`);
  }

  /**
   * Calculate initial health score based on projected income (penalty-based, docs/Spair_Score.md)
   */
  calculateInitialHealthScore(monthlyIncome: number): FinancialHealthData {
    const monthlyExpenses = monthlyIncome * 0.8;
    const netAmount = monthlyIncome - monthlyExpenses;
    const savingsRate = (netAmount / monthlyIncome) * 100;

    const pCF = penaltyCashFlow(monthlyIncome, monthlyExpenses, netAmount);
    const pEF = penaltyEmergencyFund(0);
    const pDebt = 0;
    const pSav = penaltySavings(savingsRate);
    const pStab = penaltyStability();
    const rawScore = 100 + pCF + pEF + pDebt + pSav + pStab;
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));
    const classification = getClassificationFromScore(score);

    let spendingDiscipline: "Excellent" | "Good" | "Fair" | "Poor" | "Critical" | "Unknown";
    if (savingsRate >= 30) spendingDiscipline = "Excellent";
    else if (savingsRate >= 20) spendingDiscipline = "Good";
    else if (savingsRate >= 10) spendingDiscipline = "Fair";
    else if (savingsRate >= 0) spendingDiscipline = "Poor";
    else spendingDiscipline = "Critical";

    const emergencyFundMonths = 0;

    return {
      score,
      classification,
      monthlyIncome,
      monthlyExpenses,
      netAmount,
      savingsRate,
      message: "This is a projected score based on your expected income. Add your accounts and transactions to see your actual Spair Score.",
      spendingDiscipline,
      debtExposure: "Low" as const,
      emergencyFundMonths,
      alerts: [
        {
          id: "projected_score",
          title: "Projected Score",
          description: "This score is based on your expected income. Add your accounts and transactions to see your actual financial health.",
          severity: "info" as const,
          action: "Add your accounts and transactions to get started.",
        },
      ],
      suggestions: [
        {
          id: "connect_account",
          title: "Add your accounts and transactions",
          description: "Add accounts and transactions manually or import from CSV to see your actual transactions and get personalized insights.",
          impact: "high" as const,
        },
      ],
    };
  }
}

