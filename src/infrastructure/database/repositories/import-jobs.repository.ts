/**
 * Import Jobs Repository
 * Data access layer for import jobs - only handles database operations
 */

import { createServerClient } from "../supabase-server";
import { logger } from "@/src/infrastructure/utils/logger";
import { formatTimestamp } from "@/src/infrastructure/utils/timestamp";
import { BaseImportJob } from "@/src/domain/import-jobs/import-jobs.types";

export interface ImportJobRow {
  id: string;
  userId: string;
  accountId: string | null;
  type: "plaid_sync" | "csv_import";
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  totalItems: number;
  processedItems: number;
  syncedItems: number;
  skippedItems: number;
  errorItems: number;
  errorMessage: string | null;
  retryCount: number;
  nextRetryAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any> | null;
}

export class ImportJobsRepository {
  /**
   * Find import job by ID
   */
  async findById(jobId: string, userId: string): Promise<ImportJobRow | null> {
    const supabase = await createServerClient();

    const { data: job, error } = await supabase
      .from("ImportJob")
      .select("*")
      .eq("id", jobId)
      .eq("userId", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      logger.error("[ImportJobsRepository] Error finding job:", error);
      throw new Error(`Failed to find job: ${error.message}`);
    }

    return job as ImportJobRow | null;
  }

  /**
   * Find active import jobs for a user (pending or processing)
   */
  async findActiveJobsByUserId(
    userId: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<ImportJobRow[]> {
    const supabase = await createServerClient(accessToken, refreshToken);

    const { data: jobs, error } = await supabase
      .from("ImportJob")
      .select("*")
      .eq("userId", userId)
      .in("status", ["pending", "processing"])
      .order("createdAt", { ascending: false });

    if (error) {
      logger.error("[ImportJobsRepository] Error fetching active jobs:", error);
      return [];
    }

    return (jobs || []) as ImportJobRow[];
  }
}

