/**
 * Feedback Mapper
 * Maps between domain entities and infrastructure DTOs
 */

import { BaseFeedback } from "../../domain/feedback/feedback.types";
import { FeedbackRow } from "@/src/infrastructure/database/repositories/feedback.repository";

export class FeedbackMapper {
  /**
   * Map repository row to domain entity
   */
  static toDomain(row: FeedbackRow): BaseFeedback {
    return {
      id: row.id,
      userId: row.userId,
      rating: row.rating,
      feedback: row.feedback,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}

