"use server";

import { createServerClient } from "@/lib/supabase-server";
import { formatDateStart } from "@/lib/utils/timestamp";

export type ConfidenceLevel = "high" | "medium" | "low" | "none";

export interface CategorySuggestion {
  categoryId: string;
  subcategoryId: string | null;
  confidence: ConfidenceLevel;
  matchCount: number;
  matchType: "description_and_amount" | "description_only";
}

/**
 * Normalize transaction description for matching
 * - Convert to lowercase
 * - Remove special characters
 * - Trim and normalize whitespace
 */
function normalizeDescription(description: string): string {
  if (!description) return "";
  
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Suggest category based on user's transaction history
 * 
 * Criteria for high confidence (auto-categorize):
 * - Same normalized description + same exact amount: 3+ occurrences
 * - Same normalized description: 5+ occurrences with same category
 * 
 * Criteria for medium confidence (suggest):
 * - Same normalized description + same exact amount: 2 occurrences
 * - Same normalized description: 3-4 occurrences with same category
 * 
 * @param userId - User ID to analyze history for
 * @param description - Transaction description
 * @param amount - Transaction amount
 * @param type - Transaction type (expense/income)
 * @returns Category suggestion with confidence level, or null if no match
 */
export async function suggestCategory(
  userId: string,
  description: string,
  amount: number,
  type: string
): Promise<CategorySuggestion | null> {
  if (!description || !userId) {
    return null;
  }

  const supabase = await createServerClient();
  const normalizedDesc = normalizeDescription(description);

  // Look back 12 months for historical data
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);
  const startDateStr = formatDateStart(startDate);

  // Get all categorized transactions for this user in the last 12 months
  // Only consider transactions with the same type (expense/income)
  const { data: historicalTransactions, error } = await supabase
    .from("Transaction")
    .select("id, description, amount, categoryId, subcategoryId, type")
    .eq("userId", userId)
    .eq("type", type)
    .not("categoryId", "is", null)
    .gte("date", startDateStr)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching historical transactions for category learning:", error);
    return null;
  }

  if (!historicalTransactions || historicalTransactions.length === 0) {
    return null;
  }

  // Group matches by category
  const categoryMatches = new Map<
    string,
    {
      categoryId: string;
      subcategoryId: string | null;
      descriptionAndAmount: number;
      descriptionOnly: number;
    }
  >();

  // Analyze matches
  for (const tx of historicalTransactions) {
    if (!tx.categoryId || !tx.description) continue;

    const normalizedTxDesc = normalizeDescription(tx.description);
    const key = `${tx.categoryId}-${tx.subcategoryId || "null"}`;

    if (!categoryMatches.has(key)) {
      categoryMatches.set(key, {
        categoryId: tx.categoryId,
        subcategoryId: tx.subcategoryId,
        descriptionAndAmount: 0,
        descriptionOnly: 0,
      });
    }

    const match = categoryMatches.get(key)!;

    // Check for exact description match
    if (normalizedTxDesc === normalizedDesc) {
      // Check if amount also matches (within 0.01 tolerance for floating point)
      if (Math.abs(tx.amount - amount) < 0.01) {
        match.descriptionAndAmount++;
      } else {
        match.descriptionOnly++;
      }
    }
  }

  // Find best match
  let bestMatch: CategorySuggestion | null = null;
  let bestScore = 0;

  for (const [key, match] of categoryMatches.entries()) {
    // Prioritize description + amount matches
    if (match.descriptionAndAmount >= 3) {
      // High confidence: auto-categorize
      return {
        categoryId: match.categoryId,
        subcategoryId: match.subcategoryId,
        confidence: "high",
        matchCount: match.descriptionAndAmount,
        matchType: "description_and_amount",
      };
    }

    if (match.descriptionOnly >= 5) {
      // High confidence: auto-categorize
      return {
        categoryId: match.categoryId,
        subcategoryId: match.subcategoryId,
        confidence: "high",
        matchCount: match.descriptionOnly,
        matchType: "description_only",
      };
    }

    // Calculate score for medium/low confidence suggestions
    const score = match.descriptionAndAmount * 2 + match.descriptionOnly;

    if (score > bestScore) {
      bestScore = score;
      
      if (match.descriptionAndAmount >= 2 || match.descriptionOnly >= 3) {
        // Medium confidence: suggest
        bestMatch = {
          categoryId: match.categoryId,
          subcategoryId: match.subcategoryId,
          confidence: "medium",
          matchCount: match.descriptionAndAmount >= 2 ? match.descriptionAndAmount : match.descriptionOnly,
          matchType: match.descriptionAndAmount >= 2 ? "description_and_amount" : "description_only",
        };
      } else if (match.descriptionAndAmount >= 1 || match.descriptionOnly >= 1) {
        // Low confidence: still suggest but with lower priority
        bestMatch = {
          categoryId: match.categoryId,
          subcategoryId: match.subcategoryId,
          confidence: "low",
          matchCount: match.descriptionAndAmount >= 1 ? match.descriptionAndAmount : match.descriptionOnly,
          matchType: match.descriptionAndAmount >= 1 ? "description_and_amount" : "description_only",
        };
      }
    }
  }

  return bestMatch;
}

