/**
 * Dashboard Domain Types
 */

export interface UpdateCheckResult {
  hasUpdates: boolean;
  currentHash: string;
  timestamp: string | null;
  source?: "cache" | "database";
  executionTime?: number;
}

