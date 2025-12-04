/**
 * Feedback Service
 * Business logic for feedback management
 */

import { FeedbackRepository } from "@/src/infrastructure/database/repositories/feedback.repository";
import { FeedbackMapper } from "./feedback.mapper";
import { FeedbackFormData } from "../../domain/feedback/feedback.validations";
import { BaseFeedback } from "../../domain/feedback/feedback.types";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "../shared/app-error";

export class FeedbackService {
  constructor(private repository: FeedbackRepository) {}

  /**
   * Create a new feedback entry
   */
  async createFeedback(data: FeedbackFormData): Promise<BaseFeedback> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const row = await this.repository.create(userId, {
      rating: data.rating,
      feedback: data.feedback || null,
    });

    return FeedbackMapper.toDomain(row);
  }
}

