/**
 * Feedback Factory
 * Dependency injection factory for FeedbackService
 */

import { FeedbackService } from "./feedback.service";
import { FeedbackRepository } from "@/src/infrastructure/database/repositories/feedback.repository";

/**
 * Create a FeedbackService instance with all dependencies
 */
export function makeFeedbackService(): FeedbackService {
  const repository = new FeedbackRepository();
  return new FeedbackService(repository);
}

