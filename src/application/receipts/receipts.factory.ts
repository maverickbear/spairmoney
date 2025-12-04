/**
 * Receipts Factory
 * Dependency injection factory for ReceiptsService
 */

import { ReceiptsService } from "./receipts.service";
import { OpenAIClient } from "@/src/infrastructure/external/openai/openai-client";
import { ReceiptsRepository } from "@/src/infrastructure/database/repositories/receipts.repository";

/**
 * Create a ReceiptsService instance with all dependencies
 */
export function makeReceiptsService(): ReceiptsService {
  const openaiClient = new OpenAIClient();
  const receiptsRepository = new ReceiptsRepository();
  return new ReceiptsService(openaiClient, receiptsRepository);
}

