/**
 * Import Jobs Mapper
 * Maps between domain entities and infrastructure DTOs
 */

import { BaseImportJob } from "../../domain/import-jobs/import-jobs.types";
import { ImportJobRow } from "@/src/infrastructure/database/repositories/import-jobs.repository";

export class ImportJobsMapper {
  /**
   * Map repository row to domain entity
   */
  static toDomain(row: ImportJobRow): BaseImportJob {
    return {
      id: row.id,
      userId: row.userId,
      accountId: row.accountId,
      type: row.type,
      status: row.status,
      progress: row.progress,
      totalItems: row.totalItems,
      processedItems: row.processedItems,
      syncedItems: row.syncedItems,
      skippedItems: row.skippedItems,
      errorItems: row.errorItems,
      errorMessage: row.errorMessage,
      retryCount: row.retryCount,
      nextRetryAt: row.nextRetryAt ? new Date(row.nextRetryAt) : null,
      completedAt: row.completedAt ? new Date(row.completedAt) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      metadata: row.metadata,
    };
  }
}

