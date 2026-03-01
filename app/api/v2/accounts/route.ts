import { NextRequest, NextResponse } from "next/server";
import { makeAccountsService } from "@/src/application/accounts/accounts.factory";
import { makeCreditCardDebtSyncService } from "@/src/application/credit-card-debt/credit-card-debt-sync.factory";
import { AccountFormData } from "@/src/domain/accounts/accounts.validations";
import { ZodError } from "zod";
import { getCurrentUserId, guardAccountLimit, throwIfNotAllowed } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";
import { getCacheHeaders } from "@/src/infrastructure/utils/cache-headers";
import { revalidateTag } from 'next/cache';
import { logger } from "@/src/infrastructure/utils/logger";


export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includeHoldings = searchParams.get("includeHoldings") !== "false"; // Default to true for backward compatibility
    
    const service = makeAccountsService();
    const accounts = await service.getAccounts(undefined, undefined, { includeHoldings });
    
    // Account list changes occasionally, use semi-static cache
    const cacheHeaders = getCacheHeaders('semi-static');
    
    return NextResponse.json(accounts, { 
      status: 200,
      headers: cacheHeaders,
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check account limit (this also verifies write access)
    const accountGuard = await guardAccountLimit(userId);
    await throwIfNotAllowed(accountGuard);

    const data: AccountFormData = await request.json();

    logger.info("[CreditCardDebtFlow] POST /accounts – request body", {
      type: data.type,
      initialBalance: data.initialBalance,
      initialBalanceType: typeof data.initialBalance,
    });

    const service = makeAccountsService();
    const account = await service.createAccount(data);

    logger.info("[CreditCardDebtFlow] POST /accounts – account created", {
      accountId: account.id,
      accountType: account.type,
      accountInitialBalance: account.initialBalance,
    });

    // Create linked credit-card debt with the exact value the user entered as Current Balance (amount owed).
    // Form sends it as negative for storage; we pass it to sync so the debt is created with that amount (sync uses |value| as amount owed).
    const creditCurrentBalance =
      data.type === "credit" && data.initialBalance != null && Math.abs(data.initialBalance) > 0.01
        ? data.initialBalance
        : null;

    logger.info("[CreditCardDebtFlow] POST /accounts – credit debt sync decision", {
      isCredit: account.type === "credit",
      creditCurrentBalance,
      willCallSync: account.type === "credit" && creditCurrentBalance != null && !!userId,
    });

    if (account.type === "credit" && creditCurrentBalance != null && userId) {
      try {
        const creditCardDebtSync = makeCreditCardDebtSyncService();
        await creditCardDebtSync.syncForAccount(account.id, userId, undefined, undefined, {
          overrideInitialBalance: creditCurrentBalance,
        });
      } catch (err) {
        logger.error("[POST /api/v2/accounts] Credit card debt sync after create failed:", err);
        // Do not fail the request; account was created successfully
      }
    }

    // Invalidate cache so dashboard and reports reflect new data
    revalidateTag('accounts', 'max');
    revalidateTag('subscriptions', 'max');
    revalidateTag(`dashboard-${userId}`, 'max');
    revalidateTag(`reports-${userId}`, 'max');
    
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') },
        { status: 400 }
      );
    }
    
    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : "Failed to create account";
    const statusCode = errorMessage.includes("Unauthorized") ? 401 : 400;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

