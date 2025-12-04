/**
 * Receipts Service
 * Business logic for receipt scanning
 */

import { OpenAIClient } from "@/src/infrastructure/external/openai/openai-client";
import { ReceiptsRepository } from "@/src/infrastructure/database/repositories/receipts.repository";
import { ReceiptData, ReceiptScanResult } from "../../domain/receipts/receipts.types";
import { MAX_RECEIPT_FILE_SIZE } from "../../domain/receipts/receipts.constants";
import { validateImageFile } from "@/lib/utils/file-validation";
import { logger } from "@/src/infrastructure/utils/logger";

export class ReceiptsService {
  constructor(
    private openaiClient: OpenAIClient,
    private receiptsRepository: ReceiptsRepository
  ) {}

  /**
   * Scan a receipt image and extract transaction data
   * Also saves the file to Supabase Storage
   */
  async scanReceipt(
    userId: string,
    file: File,
    buffer: Buffer
  ): Promise<ReceiptScanResult> {
    try {
      // Validate file type (images and PDFs)
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      
      if (!isImage && !isPdf) {
        return {
          success: false,
          error: "File must be an image or PDF",
        };
      }

      // Validate file size
      if (file.size > MAX_RECEIPT_FILE_SIZE) {
        return {
          success: false,
          error: `File size exceeds maximum of ${MAX_RECEIPT_FILE_SIZE / 1024 / 1024}MB`,
        };
      }

      // Validate image file (skip validation for PDFs)
      if (isImage) {
        const validation = await validateImageFile(file, buffer, MAX_RECEIPT_FILE_SIZE);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.error || "Invalid image file",
          };
        }
      }

      // Save file to Supabase Storage first
      let receiptUrl: string | undefined;
      try {
        const uploadResult = await this.receiptsRepository.uploadReceipt(userId, file, buffer);
        receiptUrl = uploadResult.url;
        logger.log("[ReceiptsService] Receipt file saved to storage:", uploadResult.path);
      } catch (uploadError) {
        logger.error("[ReceiptsService] Error saving receipt file:", uploadError);
        // Continue with scanning even if upload fails (non-critical)
      }

      // For PDFs, we can't use OpenAI Vision API, so return early
      if (isPdf) {
        return {
          success: true,
          data: {
            // PDFs can't be scanned with Vision API, return empty data
            amount: undefined,
            merchant: undefined,
            date: undefined,
            description: undefined,
            items: undefined,
          },
          receiptUrl,
        };
      }

      // Convert to base64 for OpenAI Vision API (images only)
      const base64Image = buffer.toString("base64");
      const mimeType = file.type || "image/jpeg";

      // Extract receipt data using OpenAI
      const receiptData = await this.openaiClient.extractReceiptData(base64Image, mimeType);

      return {
        success: true,
        data: receiptData,
        receiptUrl,
      };
    } catch (error) {
      logger.error("[ReceiptsService] Error scanning receipt:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to scan receipt",
      };
    }
  }
}

