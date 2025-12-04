/**
 * Portfolio Mapper
 * Maps between domain entities and converts between related domain types
 */

import { BasePortfolioHolding } from "../../domain/portfolio/portfolio.types";
import { BaseHolding } from "../../domain/investments/investments.types";

export class PortfolioMapper {
  /**
   * Convert investment holding (BaseHolding) to portfolio holding (BasePortfolioHolding)
   * This is a conversion between two related domain types
   */
  static investmentHoldingToPortfolioHolding(
    investmentHolding: BaseHolding
  ): BasePortfolioHolding {
    return {
      id: investmentHolding.securityId,
      symbol: investmentHolding.symbol,
      name: investmentHolding.name,
      assetType: investmentHolding.assetType as "Stock" | "ETF" | "Crypto" | "Fund",
      sector: investmentHolding.sector,
      quantity: investmentHolding.quantity,
      avgPrice: investmentHolding.avgPrice,
      currentPrice: investmentHolding.lastPrice,
      marketValue: investmentHolding.marketValue,
      bookValue: investmentHolding.bookValue,
      unrealizedPnL: investmentHolding.unrealizedPnL,
      unrealizedPnLPercent: investmentHolding.unrealizedPnLPercent,
      accountId: investmentHolding.accountId,
      accountName: investmentHolding.accountName,
    };
  }

  /**
   * Convert multiple investment holdings to portfolio holdings
   */
  static investmentHoldingsToPortfolioHoldings(
    investmentHoldings: BaseHolding[]
  ): BasePortfolioHolding[] {
    return investmentHoldings.map(this.investmentHoldingToPortfolioHolding);
  }
}

