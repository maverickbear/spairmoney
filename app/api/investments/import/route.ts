import { NextRequest, NextResponse } from "next/server";
import { makeInvestmentsService } from "@/src/application/investments/investments.factory";
import { guardFeatureAccess, getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";
import { InvestmentTransactionInput } from "@/lib/csv/investment-import";
import { normalizeAssetType } from "@/lib/utils/portfolio-utils";

interface InvestmentTransactionInputWithMetadata extends InvestmentTransactionInput {
  rowIndex?: number;
  fileName?: string;
}

interface ImportRequest {
  transactions: InvestmentTransactionInputWithMetadata[];
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to investments
    const featureGuard = await guardFeatureAccess(userId, "hasInvestments");
    if (!featureGuard.allowed) {
      return NextResponse.json(
        { 
          error: featureGuard.error?.message || "Investments are not available in your current plan",
          code: featureGuard.error?.code,
          planError: featureGuard.error,
        },
        { status: 403 }
      );
    }

    const body: ImportRequest = await request.json();
    const { transactions } = body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: "No transactions provided" },
        { status: 400 }
      );
    }

    const service = makeInvestmentsService();
    
    // Get existing securities to avoid duplicates
    const existingSecurities = await service.getSecurities();
    const securityMap = new Map<string, string>(); // symbol -> id
    existingSecurities.forEach((s) => {
      securityMap.set(s.symbol.toUpperCase(), s.id);
    });

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ rowIndex: number; fileName?: string; error: string }> = [];

    // Process transactions in batches
    const batchSize = 10;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (tx) => {
          try {
            // Create security if needed and not exists
            let securityId = tx.securityId;
            
            if (tx.securitySymbol && !securityId) {
              const symbolUpper = tx.securitySymbol.toUpperCase();
              
              // Check if security already exists
              if (securityMap.has(symbolUpper)) {
                securityId = securityMap.get(symbolUpper) || undefined;
              } else {
                // Create new security
                try {
                  const security = await service.createSecurity({
                    symbol: tx.securitySymbol,
                    name: tx.securityName || tx.securitySymbol,
                    class: normalizeAssetType(tx.securityClass) || "Stock",
                  });
                  if (security && security.id) {
                    securityId = security.id;
                    if (securityId) {
                      securityMap.set(symbolUpper, securityId);
                    }
                  }
                } catch (error) {
                  console.error(`Error creating security ${tx.securitySymbol}:`, error);
                  // Continue without securityId for non-buy/sell transactions
                }
              }
            }
            
            // Create transaction
            const transactionData: any = {
              date: tx.date instanceof Date ? tx.date : new Date(tx.date),
              accountId: tx.accountId,
              securityId: securityId || undefined,
              type: tx.type,
              fees: tx.fees || 0,
              notes: tx.notes,
            };
            
            // Only add quantity and price for buy/sell transactions
            if (tx.type === "buy" || tx.type === "sell") {
              transactionData.quantity = tx.quantity;
              transactionData.price = tx.price;
            }
            
            await service.createInvestmentTransaction(transactionData);
            successCount++;
          } catch (error) {
            errorCount++;
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            errors.push({
              rowIndex: tx.rowIndex || 0,
              fileName: tx.fileName,
              error: errorMessage,
            });
            console.error("Error importing transaction:", error);
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      imported: successCount,
      errors: errorCount,
      errorDetails: errors,
    });
  } catch (error) {
    console.error("Error in investment import:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to import transactions",
      },
      { status: 500 }
    );
  }
}

