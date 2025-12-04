/**
 * Receipts Repository
 * Handles storage operations for receipt files
 */

import { createServerClient } from "../supabase-server";
import { logger } from "@/src/infrastructure/utils/logger";
import { sanitizeFilename, getFileExtension } from "@/lib/utils/file-validation";

export class ReceiptsRepository {
  private readonly BUCKET_NAME = "receipts";

  /**
   * Upload a receipt file to Supabase Storage
   * Files are stored in user-specific folders: {userId}/{timestamp}-{random}.{ext}
   */
  async uploadReceipt(
    userId: string,
    file: File,
    buffer: Buffer
  ): Promise<{ url: string; path: string }> {
    const supabase = await createServerClient();

    // Sanitize filename
    const sanitizedOriginalName = sanitizeFilename(file.name);
    const fileExt = getFileExtension(sanitizedOriginalName) || getFileExtension(file.name) || "jpg";
    
    // Generate unique filename: {userId}/{timestamp}-{random}.{ext}
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${userId}/${timestamp}-${randomSuffix}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logger.error("[ReceiptsRepository] Error uploading receipt:", uploadError);
      throw new Error(`Failed to upload receipt: ${uploadError.message}`);
    }

    // Get signed URL (since bucket is private)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(fileName, 31536000); // 1 year expiration

    if (urlError || !urlData?.signedUrl) {
      logger.error("[ReceiptsRepository] Error creating signed URL:", urlError);
      throw new Error("Failed to create receipt URL");
    }

    return {
      url: urlData.signedUrl,
      path: fileName,
    };
  }

  /**
   * Delete a receipt file from Supabase Storage
   */
  async deleteReceipt(filePath: string): Promise<void> {
    const supabase = await createServerClient();

    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      logger.error("[ReceiptsRepository] Error deleting receipt:", error);
      throw new Error(`Failed to delete receipt: ${error.message}`);
    }
  }

  /**
   * Get a signed URL for a receipt file
   */
  async getReceiptUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const supabase = await createServerClient();

    const { data: urlData, error: urlError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (urlError || !urlData?.signedUrl) {
      logger.error("[ReceiptsRepository] Error creating signed URL:", urlError);
      throw new Error("Failed to create receipt URL");
    }

    return urlData.signedUrl;
  }
}

