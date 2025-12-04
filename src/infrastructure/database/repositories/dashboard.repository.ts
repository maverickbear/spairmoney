/**
 * Dashboard Repository
 * Data access layer for dashboard operations - only handles database operations
 */

import { createServerClient } from "../supabase-server";
import { logger } from "@/src/infrastructure/utils/logger";

export class DashboardRepository {
  /**
   * Get latest updates using RPC function
   */
  async getLatestUpdatesRPC(userId: string): Promise<Array<{ table_name: string; last_update: number }>> {
    const supabase = await createServerClient();

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_latest_updates", {
        p_user_id: userId,
      });

      if (rpcError) {
        logger.warn("[DashboardRepository] RPC function error:", rpcError);
        return [];
      }

      if (!rpcData) {
        return [];
      }

      return rpcData.map((item: any) => ({
        table_name: item.table_name,
        last_update: item.last_update,
      }));
    } catch (error) {
      logger.warn("[DashboardRepository] RPC function not available:", error);
      return [];
    }
  }

  /**
   * Check table for latest update (fallback method)
   */
  async checkTableLatestUpdate(tableName: string): Promise<{ table_name: string; last_update: number } | null> {
    const supabase = await createServerClient();

    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("updatedAt, createdAt")
        .order("updatedAt", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      const updated = data.updatedAt ? new Date(data.updatedAt).getTime() : 0;
      const created = data.createdAt ? new Date(data.createdAt).getTime() : 0;
      return { table_name: tableName, last_update: Math.max(updated, created) };
    } catch (err) {
      logger.warn(`[DashboardRepository] Error checking table ${tableName}:`, err);
      return null;
    }
  }

  /**
   * Get latest updates using fallback method (individual table queries)
   */
  async getLatestUpdatesFallback(): Promise<Array<{ table_name: string; last_update: number }>> {
    const checks = await Promise.all([
      this.checkTableLatestUpdate("Transaction"),
      this.checkTableLatestUpdate("Account"),
      this.checkTableLatestUpdate("Budget"),
      this.checkTableLatestUpdate("Goal"),
      this.checkTableLatestUpdate("Debt"),
      this.checkTableLatestUpdate("SimpleInvestmentEntry"),
    ]);

    return checks.filter(
      (item): item is { table_name: string; last_update: number } => item !== null
    );
  }
}

