/**
 * Investments Service
 * Business logic for investments management
 * Note: getHoldings is complex and kept here for now, but could be refactored into a separate calculator
 */

import { InvestmentsRepository } from "@/src/infrastructure/database/repositories/investments.repository";
import { AccountsRepository } from "@/src/infrastructure/database/repositories/accounts.repository";
import { InvestmentsMapper } from "./investments.mapper";
import { InvestmentTransactionFormData, SecurityPriceFormData, InvestmentAccountFormData } from "../../domain/investments/investments.validations";
import { BaseHolding, BaseInvestmentTransaction, BaseSecurity, BaseSecurityPrice } from "../../domain/investments/investments.types";
import { createServerClient } from "@/src/infrastructure/database/supabase-server";
import { formatTimestamp, formatDateOnly } from "@/src/infrastructure/utils/timestamp";
import { mapClassToSector, normalizeAssetType } from "@/lib/utils/portfolio-utils";
import { logger } from "@/src/infrastructure/utils/logger";
import { HOLDINGS_CACHE_TTL } from "../../domain/investments/investments.constants";
import { AppError } from "../shared/app-error";
import { getCurrentUserId } from "../shared/feature-guard";

// In-memory cache for holdings
const holdingsCache = new Map<string, { data: BaseHolding[]; timestamp: number }>();

function cleanHoldingsCache() {
  const now = Date.now();
  for (const [key, value] of holdingsCache.entries()) {
    if (now - value.timestamp > HOLDINGS_CACHE_TTL) {
      holdingsCache.delete(key);
    }
  }
}

export class InvestmentsService {
  constructor(
    private repository: InvestmentsRepository,
    private accountsRepository: AccountsRepository
  ) {}

  /**
   * Get holdings (complex calculation from positions or transactions)
   * This is a complex operation that calculates current portfolio holdings
   */
  async getHoldings(
    accountId?: string,
    accessToken?: string,
    refreshToken?: string,
    useCache: boolean = true
  ): Promise<BaseHolding[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
      // In server components, this can happen during SSR - return empty array gracefully
      // Don't log as error since this is expected in some contexts
      return [];
    }

    // Check cache
    const cacheKey = `holdings:${userId}:${accountId || 'all'}`;
    if (useCache) {
      cleanHoldingsCache();
      const cached = holdingsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < HOLDINGS_CACHE_TTL) {
        return cached.data;
      }
    }

    // Try positions first (faster and more accurate)
    const positions = await this.repository.findPositions(accountId, accessToken, refreshToken);

    if (positions && positions.length > 0) {
      // Fetch securities and accounts for enrichment
      const securityIds = new Set(positions.map(p => p.securityId));
      const accountIds = new Set(positions.map(p => p.accountId));

      const [securities, accounts] = await Promise.all([
        securityIds.size > 0
          ? this.repository.findSecuritiesByIds(Array.from(securityIds), accessToken, refreshToken)
          : Promise.resolve([]),
        accountIds.size > 0
          ? this.accountsRepository.findByIds(Array.from(accountIds), accessToken, refreshToken)
          : Promise.resolve([]),
      ]);

      const securityMap = new Map(securities.map(s => [s.id, s]));
      const accountMap = new Map(accounts.map(a => [a.id, a]));

      const holdings = positions.map(position => {
        const security = securityMap.get(position.securityId);
        const account = accountMap.get(position.accountId);
        return InvestmentsMapper.positionToHolding(position, security || undefined, account || undefined);
      });

      if (useCache) {
        holdingsCache.set(cacheKey, { data: holdings, timestamp: Date.now() });
      }
      return holdings;
    }

    // Fallback: calculate from transactions (slower but necessary if positions unavailable)
    return await this.calculateHoldingsFromTransactions(accountId, accessToken, refreshToken, useCache);
  }

  /**
   * Calculate holdings from transactions (private method)
   * This is used as a fallback when positions are not available
   */
  private async calculateHoldingsFromTransactions(
    accountId?: string,
    accessToken?: string,
    refreshToken?: string,
    useCache: boolean = true
  ): Promise<BaseHolding[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
      // In server components, this can happen during SSR - return empty array gracefully
      return [];
    }

    const cacheKey = `holdings:${userId}:${accountId || 'all'}`;
    if (useCache) {
      cleanHoldingsCache();
      const cached = holdingsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < HOLDINGS_CACHE_TTL) {
        return cached.data;
      }
    }

    // Get transactions
    const transactions = await this.repository.findTransactions(
      accountId ? { accountId } : undefined,
      accessToken,
      refreshToken
    );

    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Fetch securities and accounts for enrichment
    const securityIds = new Set(transactions.filter(t => t.securityId).map(t => t.securityId!));
    const accountIds = new Set(transactions.map(t => t.accountId));

    const [securities, accounts] = await Promise.all([
      securityIds.size > 0
        ? this.repository.findSecuritiesByIds(Array.from(securityIds), accessToken, refreshToken)
        : Promise.resolve([]),
      accountIds.size > 0
        ? this.accountsRepository.findByIds(Array.from(accountIds), accessToken, refreshToken)
        : Promise.resolve([]),
    ]);

    const securityMap = new Map(securities.map(s => [s.id, s]));
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    // Group by security and account
    const holdingKeyMap = new Map<string, BaseHolding>();

    for (const tx of transactions) {
      if (!tx.securityId || (tx.type !== "buy" && tx.type !== "sell")) {
        continue;
      }

      const security = securityMap.get(tx.securityId);
      const account = accountMap.get(tx.accountId);
      const holdingKey = `${tx.securityId}_${tx.accountId}`;

      if (!holdingKeyMap.has(holdingKey)) {
        const assetType = security?.class || "Stock";
        const sector = security?.sector || mapClassToSector(assetType, security?.symbol || "");

        holdingKeyMap.set(holdingKey, {
          securityId: tx.securityId,
          symbol: security?.symbol || "",
          name: security?.name || security?.symbol || "",
          assetType: normalizeAssetType(assetType),
          sector,
          quantity: 0,
          avgPrice: 0,
          bookValue: 0,
          lastPrice: 0,
          marketValue: 0,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0,
          accountId: tx.accountId,
          accountName: account?.name || "Unknown Account",
        });
      }

      const holding = holdingKeyMap.get(holdingKey)!;

      if (tx.type === "buy" && tx.quantity && tx.price) {
        const newCost = tx.quantity * tx.price + (tx.fees || 0);
        const totalCost = holding.bookValue + newCost;
        const totalQuantity = holding.quantity + tx.quantity;

        holding.avgPrice = totalQuantity > 0 ? totalCost / totalQuantity : tx.price;
        holding.quantity = totalQuantity;
        holding.bookValue = totalCost;
      } else if (tx.type === "sell" && tx.quantity) {
        holding.quantity = Math.max(0, holding.quantity - tx.quantity);
        const soldCost = tx.quantity * holding.avgPrice;
        holding.bookValue = Math.max(0, holding.bookValue - soldCost);
      }
    }

    // Get latest prices
    const allSecurityIds = Array.from(new Set(Array.from(holdingKeyMap.values()).map(h => h.securityId)));
    if (allSecurityIds.length > 0) {
      const supabase = await createServerClient(accessToken, refreshToken);
      const { data: prices } = await supabase
        .from("SecurityPrice")
        .select("securityId, price, date")
        .in("securityId", allSecurityIds)
        .order("securityId", { ascending: true })
        .order("date", { ascending: false });

      const priceMap = new Map<string, number>();
      if (prices) {
        for (const price of prices) {
          if (!priceMap.has(price.securityId)) {
            priceMap.set(price.securityId, price.price);
          }
        }
      }

      // Apply prices to holdings
      for (const holding of holdingKeyMap.values()) {
        const latestPrice = priceMap.get(holding.securityId);
        if (latestPrice && latestPrice > 0) {
          holding.lastPrice = latestPrice;
          holding.marketValue = holding.quantity * latestPrice;
          holding.unrealizedPnL = holding.marketValue - holding.bookValue;
          holding.unrealizedPnLPercent = holding.bookValue > 0 
            ? (holding.unrealizedPnL / holding.bookValue) * 100 
            : 0;
        } else if (holding.avgPrice > 0) {
          holding.lastPrice = holding.avgPrice;
          holding.marketValue = holding.quantity * holding.avgPrice;
          holding.unrealizedPnL = 0;
          holding.unrealizedPnLPercent = 0;
        }
      }
    }

    // Filter out zero quantity holdings
    const holdings = Array.from(holdingKeyMap.values()).filter((h) => h.quantity > 0);

    if (useCache) {
      holdingsCache.set(cacheKey, { data: holdings, timestamp: Date.now() });
    }

    return holdings;
  }

  /**
   * Clear holdings cache
   */
  clearHoldingsCache(userId?: string): void {
    if (userId) {
      for (const key of holdingsCache.keys()) {
        if (key.startsWith(`holdings:${userId}:`)) {
          holdingsCache.delete(key);
        }
      }
    } else {
      holdingsCache.clear();
    }
  }

  /**
   * Get portfolio value
   */
  async getPortfolioValue(
    accountId?: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<number> {
    const holdings = await this.getHoldings(accountId, accessToken, refreshToken);
    return holdings.reduce((sum, h) => sum + h.marketValue, 0);
  }

  /**
   * Get total investments value (simple investments)
   * Calculates total value from SimpleInvestmentEntry and AccountInvestmentValue
   */
  async getTotalInvestmentsValue(): Promise<number> {
    const userId = await getCurrentUserId();
    if (!userId) {
      return 0;
    }

    const supabase = await createServerClient();

    // Get all investment accounts (type = "investment")
    const { data: investmentAccounts, error: accountsError } = await supabase
      .from("Account")
      .select("id")
      .eq("type", "investment");

    if (accountsError || !investmentAccounts || investmentAccounts.length === 0) {
      // Handle permission denied errors gracefully
      if (accountsError?.code === '42501' || accountsError?.message?.includes('permission denied')) {
        logger.warn("[InvestmentsService] Permission denied fetching investment accounts - user may not be authenticated");
        return 0;
      }
      return 0;
    }

    const accountIds = investmentAccounts.map((acc) => acc.id);

    // Get stored values for these accounts
    const { data: storedValues, error: valuesError } = await supabase
      .from("AccountInvestmentValue")
      .select("accountId, totalValue")
      .in("accountId", accountIds);

    // Get all entries for these accounts
    const { data: entries, error: entriesError } = await supabase
      .from("SimpleInvestmentEntry")
      .select("accountId, type, amount")
      .in("accountId", accountIds);

    // Calculate total value for each account
    let totalValue = 0;

    for (const account of investmentAccounts) {
      const storedValue = storedValues?.find((v) => v.accountId === account.id);
      
      if (storedValue) {
        // Use stored value if available
        totalValue += storedValue.totalValue;
      } else {
        // Calculate from entries if no stored value
        const accountEntries = entries?.filter((e) => e.accountId === account.id) || [];
        const accountTotal = accountEntries.reduce((sum, entry) => {
          // All entry types contribute to the total value
          if (entry.type === "initial" || entry.type === "contribution") {
            return sum + entry.amount;
          } else if (entry.type === "dividend" || entry.type === "interest") {
            return sum + entry.amount;
          }
          return sum;
        }, 0);
        totalValue += accountTotal;
      }
    }

    return totalValue;
  }

  /**
   * Get investment transactions
   */
  async getInvestmentTransactions(filters?: {
    accountId?: string;
    securityId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<BaseInvestmentTransaction[]> {
    const transactions = await this.repository.findTransactions(filters);

    // Fetch relations
    const securityIds = new Set(transactions.filter(t => t.securityId).map(t => t.securityId!));
    const accountIds = new Set(transactions.map(t => t.accountId));

    const [securities, accounts] = await Promise.all([
      securityIds.size > 0
        ? this.repository.findSecuritiesByIds(Array.from(securityIds))
        : Promise.resolve([]),
      accountIds.size > 0
        ? this.accountsRepository.findByIds(Array.from(accountIds))
        : Promise.resolve([]),
    ]);

    const securityMap = new Map(securities.map(s => [s.id, s]));
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    return transactions.map(tx => {
      return InvestmentsMapper.transactionToDomain(tx, {
        security: tx.securityId ? (securityMap.get(tx.securityId) || null) : null,
        account: accountMap.get(tx.accountId) || null,
      });
    });
  }

  /**
   * Create investment transaction
   */
  async createInvestmentTransaction(data: InvestmentTransactionFormData): Promise<BaseInvestmentTransaction> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const id = crypto.randomUUID();
    const date = data.date instanceof Date ? data.date : new Date(data.date);
    const transactionDate = formatDateOnly(date);
    const now = formatTimestamp(new Date());

    const transactionRow = await this.repository.createTransaction({
      id,
      date: transactionDate,
      accountId: data.accountId,
      securityId: data.securityId || null,
      type: data.type,
      quantity: data.quantity || null,
      price: data.price || null,
      fees: data.fees || 0,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
    });

    // Clear cache
    this.clearHoldingsCache(userId);

    // Fetch relations
    const relations = await this.fetchTransactionRelations(transactionRow);

    return InvestmentsMapper.transactionToDomain(transactionRow, relations);
  }

  /**
   * Update investment transaction
   */
  async updateInvestmentTransaction(
    id: string,
    data: Partial<InvestmentTransactionFormData>
  ): Promise<BaseInvestmentTransaction> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const updateData: any = {};
    if (data.date) {
      const date = data.date instanceof Date ? data.date : new Date(data.date);
      updateData.date = formatDateOnly(date);
    }
    if (data.accountId) updateData.accountId = data.accountId;
    if (data.securityId !== undefined) updateData.securityId = data.securityId || null;
    if (data.type) updateData.type = data.type;
    if (data.quantity !== undefined) updateData.quantity = data.quantity || null;
    if (data.price !== undefined) updateData.price = data.price || null;
    if (data.fees !== undefined) updateData.fees = data.fees || 0;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    const updatedRow = await this.repository.updateTransaction(id, updateData);

    // Clear cache
    this.clearHoldingsCache(userId);

    // Fetch relations
    const relations = await this.fetchTransactionRelations(updatedRow);

    return InvestmentsMapper.transactionToDomain(updatedRow, relations);
  }

  /**
   * Delete investment transaction
   */
  async deleteInvestmentTransaction(id: string): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    await this.repository.deleteTransaction(id);

    // Clear cache
    this.clearHoldingsCache(userId);
  }

  /**
   * Get securities
   */
  async getSecurities(): Promise<BaseSecurity[]> {
    const securities = await this.repository.findSecurities();
    return securities.map(s => InvestmentsMapper.securityToDomain(s));
  }

  /**
   * Create security
   */
  async createSecurity(data: { symbol: string; name: string; class: string }): Promise<BaseSecurity> {
    const id = crypto.randomUUID();
    const now = formatTimestamp(new Date());
    const normalizedClass = normalizeAssetType(data.class);

    const securityRow = await this.repository.createSecurity({
      id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      class: normalizedClass,
      createdAt: now,
      updatedAt: now,
    });

    return InvestmentsMapper.securityToDomain(securityRow);
  }

  /**
   * Get security prices
   */
  async getSecurityPrices(securityId?: string): Promise<BaseSecurityPrice[]> {
    const prices = await this.repository.findSecurityPrices(securityId);
    
    // Fetch securities if needed
    const securityIds = new Set(prices.map(p => p.securityId));
    const supabase = await createServerClient();
    const { data: securities } = await supabase
      .from("Security")
      .select("*")
      .in("id", Array.from(securityIds));

    const securityMap = new Map((securities || []).map(s => [s.id, InvestmentsMapper.securityToDomain(s)]));

    return prices.map(price => {
      return InvestmentsMapper.securityPriceToDomain(price, securityMap.get(price.securityId));
    });
  }

  /**
   * Create security price
   */
  async createSecurityPrice(data: SecurityPriceFormData): Promise<BaseSecurityPrice> {
    const id = crypto.randomUUID();
    const date = data.date instanceof Date ? data.date : new Date(data.date);
    const priceDate = formatTimestamp(date);
    const now = formatTimestamp(new Date());

    const priceRow = await this.repository.createSecurityPrice({
      id,
      securityId: data.securityId,
      date: priceDate,
      price: data.price,
      createdAt: now,
    });

    // Fetch security
    const supabase = await createServerClient();
    const { data: security } = await supabase
      .from("Security")
      .select("*")
      .eq("id", data.securityId)
      .single();

    return InvestmentsMapper.securityPriceToDomain(priceRow, security ? InvestmentsMapper.securityToDomain(security) : null);
  }

  /**
   * Get investment accounts
   */
  async getInvestmentAccounts(
    accessToken?: string,
    refreshToken?: string
  ): Promise<Array<{ id: string; name: string; type: string; userId: string; householdId: string | null; createdAt: Date | string; updatedAt: Date | string }>> {
    try {
      const accounts = await this.repository.findInvestmentAccounts(accessToken, refreshToken);
      return accounts.map(a => ({
        ...a,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
      }));
    } catch (error: any) {
      // Handle permission denied errors gracefully (can happen during SSR)
      if (error?.code === '42501' || error?.message?.includes('permission denied')) {
        logger.warn("[InvestmentsService] Permission denied fetching investment accounts - user may not be authenticated");
        return [];
      }
      throw error;
    }
  }

  /**
   * Create investment account
   */
  async createInvestmentAccount(data: InvestmentAccountFormData, accessToken?: string, refreshToken?: string): Promise<{ id: string; name: string; type: string; userId: string; householdId: string | null; createdAt: Date | string; updatedAt: Date | string }> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const id = crypto.randomUUID();
    const now = formatTimestamp(new Date());

    const supabase = await createServerClient(accessToken, refreshToken);

    // Create account in Account table with type "investment"
    const { data: account, error } = await supabase
      .from("Account")
      .insert({
        id,
        name: data.name,
        type: "investment",
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) {
      logger.error("[InvestmentsService] Error creating investment account:", error);
      throw new AppError(`Failed to create investment account: ${error.message}`, 500);
    }

    return {
      ...account,
      createdAt: new Date(account.createdAt),
      updatedAt: new Date(account.updatedAt),
    };
  }

  /**
   * Helper to fetch transaction relations
   */
  private async fetchTransactionRelations(
    transaction: any
  ): Promise<{
    account?: { id: string; name: string; type: string } | null;
    security?: { id: string; symbol: string; name: string; class: string; sector: string | null } | null;
  }> {
    const relations: any = {};

    if (transaction.accountId) {
      const account = await this.accountsRepository.findById(transaction.accountId);
      relations.account = account ? { id: account.id, name: account.name, type: account.type } : null;
    }

    if (transaction.securityId) {
      const securities = await this.repository.findSecuritiesByIds([transaction.securityId]);
      const security = securities[0] || null;
      relations.security = security ? { id: security.id, symbol: security.symbol, name: security.name, class: security.class, sector: security.sector } : null;
    }

    return relations;
  }
}

