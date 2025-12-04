/**
 * Goals Repository
 * Data access layer for goals - only handles database operations
 * No business logic here
 */

import { createServerClient } from "../supabase-server";
import { BaseGoal } from "../../../domain/goals/goals.types";
import { logger } from "@/lib/utils/logger";

export interface GoalRow {
  id: string;
  name: string;
  targetAmount: number;
  currentBalance: number;
  incomePercentage: number;
  priority: "High" | "Medium" | "Low";
  isPaused: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  description: string | null;
  expectedIncome: number | null;
  targetMonths: number | null;
  accountId: string | null;
  holdingId: string | null;
  isSystemGoal: boolean;
  userId: string;
  householdId: string | null;
  createdAt: string;
  updatedAt: string;
}

export class GoalsRepository {
  /**
   * Find all goals for a user
   */
  async findAll(
    accessToken?: string,
    refreshToken?: string
  ): Promise<GoalRow[]> {
    const supabase = await createServerClient(accessToken, refreshToken);

    // Verify authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.warn("[GoalsRepository] User not authenticated, returning empty array");
      return [];
    }

    logger.debug(`[GoalsRepository] Fetching goals for user: ${user.id}`);

    const { data: goals, error } = await supabase
      .from("Goal")
      .select("*")
      .order("priority", { ascending: true })
      .order("createdAt", { ascending: false });

    if (error) {
      // Handle permission denied errors gracefully (can happen during SSR)
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        logger.warn("[GoalsRepository] Permission denied fetching goals - RLS may be blocking. Returning empty array.", {
          userId: user.id,
          errorCode: error.code,
          errorMessage: error.message,
        });
        return [];
      }
      logger.error("[GoalsRepository] Error fetching goals:", {
        userId: user.id,
        error,
        errorCode: error.code,
        errorMessage: error.message,
      });
      throw new Error(`Failed to fetch goals: ${error.message}`);
    }

    logger.debug(`[GoalsRepository] Found ${goals?.length || 0} goals for user ${user.id}`);
    return (goals || []) as GoalRow[];
  }

  /**
   * Find goal by ID
   */
  async findById(
    id: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<GoalRow | null> {
    const supabase = await createServerClient(accessToken, refreshToken);

    const { data: goal, error } = await supabase
      .from("Goal")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error("[GoalsRepository] Error fetching goal:", error);
      throw new Error(`Failed to fetch goal: ${error.message}`);
    }

    return goal as GoalRow;
  }

  /**
   * Create a new goal
   */
  async create(data: {
    id: string;
    name: string;
    targetAmount: number;
    currentBalance: number;
    incomePercentage: number;
    priority: "High" | "Medium" | "Low";
    isPaused: boolean;
    isCompleted: boolean;
    completedAt: string | null;
    description: string | null;
    expectedIncome: number | null;
    targetMonths: number | null;
    accountId: string | null;
    holdingId: string | null;
    isSystemGoal: boolean;
    userId: string;
    householdId: string | null;
    createdAt: string;
    updatedAt: string;
  }): Promise<GoalRow> {
    const supabase = await createServerClient();

    const { data: goal, error } = await supabase
      .from("Goal")
      .insert({
        id: data.id,
        name: data.name,
        targetAmount: data.targetAmount,
        currentBalance: data.currentBalance,
        incomePercentage: data.incomePercentage,
        priority: data.priority,
        isPaused: data.isPaused,
        isCompleted: data.isCompleted,
        completedAt: data.completedAt,
        description: data.description,
        expectedIncome: data.expectedIncome,
        targetMonths: data.targetMonths,
        accountId: data.accountId,
        holdingId: data.holdingId,
        isSystemGoal: data.isSystemGoal,
        userId: data.userId,
        householdId: data.householdId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
      .select()
      .single();

    if (error) {
      logger.error("[GoalsRepository] Error creating goal:", error);
      throw new Error(`Failed to create goal: ${error.message}`);
    }

    return goal as GoalRow;
  }

  /**
   * Update a goal
   */
  async update(
    id: string,
    data: Partial<{
      name: string;
      targetAmount: number;
      currentBalance: number;
      incomePercentage: number;
      priority: "High" | "Medium" | "Low";
      isPaused: boolean;
      isCompleted: boolean;
      completedAt: string | null;
      description: string | null;
      expectedIncome: number | null;
      targetMonths: number | null;
      accountId: string | null;
      holdingId: string | null;
      updatedAt: string;
    }>
  ): Promise<GoalRow> {
    const supabase = await createServerClient();

    const { data: goal, error } = await supabase
      .from("Goal")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("[GoalsRepository] Error updating goal:", error);
      throw new Error(`Failed to update goal: ${error.message}`);
    }

    return goal as GoalRow;
  }

  /**
   * Delete a goal
   */
  async delete(id: string): Promise<void> {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from("Goal")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error("[GoalsRepository] Error deleting goal:", error);
      throw new Error(`Failed to delete goal: ${error.message}`);
    }
  }

  /**
   * Find system goal by type
   */
  async findSystemGoal(
    userId: string,
    isSystemGoal: boolean = true
  ): Promise<GoalRow | null> {
    const supabase = await createServerClient();

    const { data: goal, error } = await supabase
      .from("Goal")
      .select("*")
      .eq("userId", userId)
      .eq("isSystemGoal", isSystemGoal)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error("[GoalsRepository] Error fetching system goal:", error);
      return null;
    }

    return goal as GoalRow;
  }

  /**
   * Find emergency fund goal by household ID
   */
  async findEmergencyFundGoal(
    householdId: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<GoalRow | null> {
    const supabase = await createServerClient(accessToken, refreshToken);

    const { data: goal, error } = await supabase
      .from("Goal")
      .select("*")
      .eq("householdId", householdId)
      .eq("name", "Emergency Funds")
      .eq("isSystemGoal", true)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error("[GoalsRepository] Error fetching emergency fund goal:", error);
      return null;
    }

    return goal as GoalRow | null;
  }
}

