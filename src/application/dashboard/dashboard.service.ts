/**
 * Dashboard Service
 * Business logic for dashboard operations
 */

import { DashboardRepository } from "@/src/infrastructure/database/repositories/dashboard.repository";
import { UpdateCheckResult } from "../../domain/dashboard/dashboard.types";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "../shared/app-error";


export class DashboardService {
  constructor(private repository: DashboardRepository) {}

  /**
   * Check for updates silently
   * Returns a hash/timestamp that changes when any relevant data is updated
   */
  async checkUpdates(lastCheck?: string | null): Promise<UpdateCheckResult> {
    const startTime = Date.now();
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    // Fetch from database
    // Try RPC function first
    let updates = await this.repository.getLatestUpdatesRPC(userId);

    // Fallback to individual queries if RPC doesn't work
    if (updates.length === 0) {
      updates = await this.repository.getLatestUpdatesFallback();
    }

    // Calculate hash based on latest update
    const timestamps = updates.map((u) => u.last_update).filter((t) => t > 0);
    const maxTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : 0;
    const currentHash = maxTimestamp.toString();

    // Check if there are updates
    let hasUpdates = false;
    if (lastCheck) {
      const lastCheckTime = new Date(lastCheck).getTime();
      hasUpdates = maxTimestamp > lastCheckTime;
    }

    // Prepare response
    const result: UpdateCheckResult = {
      hasUpdates,
      currentHash,
      timestamp: maxTimestamp > 0 ? new Date(maxTimestamp).toISOString() : null,
      source: "database",
      executionTime: Date.now() - startTime,
    };

    return result;
  }
}

