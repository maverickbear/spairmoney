/**
 * Feedback Repository
 * Data access layer for feedback - only handles database operations
 */

import { createServerClient } from "../supabase-server";
import { logger } from "@/src/infrastructure/utils/logger";

export interface FeedbackRow {
  id: string;
  user_id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

export class FeedbackRepository {
  /**
   * Create a new feedback entry
   */
  async create(
    userId: string,
    data: {
      rating: number;
      feedback?: string | null;
    }
  ): Promise<FeedbackRow> {
    const supabase = await createServerClient();

    const { data: feedback, error } = await supabase
      .from("system_support_feedback")
      .insert({
        user_id: userId,
        rating: data.rating,
        feedback: data.feedback || null,
      })
      .select()
      .single();

    if (error) {
      logger.error("[FeedbackRepository] Error creating feedback:", error);
      throw new Error(`Failed to create feedback: ${error.message}`);
    }

    if (!feedback) {
      throw new Error("Failed to create feedback: No data returned");
    }

    return feedback as FeedbackRow;
  }
}

