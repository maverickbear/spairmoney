/**
 * Import Jobs Service
 * Business logic for import jobs management
 */

import { ImportJobsRepository } from "@/src/infrastructure/database/repositories/import-jobs.repository";
import { ImportJobsMapper } from "./import-jobs.mapper";
import { BaseImportJob } from "../../domain/import-jobs/import-jobs.types";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "../shared/app-error";

export class ImportJobsService {
  constructor(private repository: ImportJobsRepository) {}

  /**
   * Get import job by ID
   */
  async getImportJob(jobId: string): Promise<BaseImportJob> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const job = await this.repository.findById(jobId, userId);
    if (!job) {
      throw new AppError("Job not found", 404);
    }

    return ImportJobsMapper.toDomain(job);
  }

  /**
   * Get active import jobs for current user
   */
  async getActiveImportJobs(): Promise<BaseImportJob[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const jobs = await this.repository.findActiveJobsByUserId(userId);
    return jobs.map(ImportJobsMapper.toDomain);
  }
}

