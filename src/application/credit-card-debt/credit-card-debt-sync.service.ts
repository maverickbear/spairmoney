/**
 * Credit Card Debt Sync Service
 * Syncs a single credit-card Debt for an account based on transactions.
 * One Debt per credit account; balance = expenses − incoming transfers.
 */

import { IAccountsRepository } from "@/src/infrastructure/database/repositories/interfaces/accounts.repository.interface";
import { ITransactionsRepository } from "@/src/infrastructure/database/repositories/interfaces/transactions.repository.interface";
import { DebtsRepository } from "@/src/infrastructure/database/repositories/debts.repository";
import { DebtsService } from "@/src/application/debts/debts.service";
import { DebtPlannedPaymentsService } from "@/src/application/planned-payments/debt-planned-payments.service";
import { getActiveHouseholdId } from "@/lib/utils/household";
import { formatTimestamp } from "@/src/infrastructure/utils/timestamp";
import { logger } from "@/src/infrastructure/utils/logger";

export class CreditCardDebtSyncService {
  constructor(
    private accountsRepository: IAccountsRepository,
    private transactionsRepository: ITransactionsRepository,
    private debtsRepository: DebtsRepository,
    private debtsService: DebtsService,
    private debtPlannedPaymentsService: DebtPlannedPaymentsService
  ) {}

  /**
   * Sync credit-card debt for an account: compute balance from transactions,
   * create or update the single Debt for this account. No-op if account is not credit type.
   * @param options.overrideInitialBalance - when provided (e.g. right after creating the account), use this instead of reading from DB so the debt uses the value just persisted
   */
  async syncForAccount(
    accountId: string,
    userId: string,
    accessToken?: string,
    refreshToken?: string,
    options?: { overrideInitialBalance?: number | null }
  ): Promise<void> {
    logger.info("[CreditCardDebtFlow] syncForAccount called", {
      accountId,
      hasOverride: options?.overrideInitialBalance !== undefined && options?.overrideInitialBalance !== null,
      overrideInitialBalance: options?.overrideInitialBalance,
    });

    const account = await this.accountsRepository.findById(accountId, accessToken, refreshToken);
    if (!account || account.type !== "credit") {
      logger.info("[CreditCardDebtFlow] syncForAccount – skip (not credit or not found)", {
        accountId,
        hasAccount: !!account,
        type: account?.type,
      });
      return;
    }

    const rows = await this.transactionsRepository.findRowsForCreditCardDebtBalance(
      accountId,
      accessToken,
      refreshToken
    );

    let expenseTotal = 0;
    let paymentTotal = 0;
    for (const row of rows) {
      const amount = Math.abs(Number(row.amount)) || 0;
      if (row.type === "expense") {
        expenseTotal += amount;
      } else if (row.type === "transfer" && row.transfer_from_id) {
        paymentTotal += amount;
      }
    }
    // Include account initial balance (stored negative for credit = amount owed).
    // Use override when provided (e.g. right after create); otherwise read from row (snake_case or camelCase).
    const rawInitial =
      options?.overrideInitialBalance !== undefined && options.overrideInitialBalance !== null
        ? options.overrideInitialBalance
        : (account as { initial_balance?: number | null }).initial_balance ??
          (account as { initialBalance?: number | null }).initialBalance ??
          null;
    const baseBalance =
      rawInitial != null && rawInitial < 0 ? Math.abs(rawInitial) : 0;
    const balance = Math.max(0, baseBalance + expenseTotal - paymentTotal);

    logger.info("[CreditCardDebtFlow] syncForAccount – balance computation", {
      accountId,
      accountName: account.name,
      fromOverride: options?.overrideInitialBalance !== undefined && options.overrideInitialBalance !== null,
      rawInitial,
      accountInitial_balance: (account as { initial_balance?: number | null }).initial_balance,
      accountInitialBalance: (account as { initialBalance?: number | null }).initialBalance,
      baseBalance,
      expenseTotal,
      paymentTotal,
      balance,
    });

    const existing = await this.debtsRepository.findByAccountIdAndLoanType(
      accountId,
      "credit_card",
      accessToken,
      refreshToken
    );

    const now = formatTimestamp(new Date());

    if (balance <= 0) {
      logger.info("[CreditCardDebtFlow] syncForAccount – balance <= 0, skip create/update paid off", {
        accountId,
        balance,
        hadExisting: !!existing,
        existingDebtId: existing?.id,
        rawInitial,
        baseBalance,
      });
      if (existing) {
        logger.info("[CreditCardDebtFlow] syncForAccount – UPDATING debt to Paid Off (currentBalance=0)", {
          debtId: existing.id,
          debtName: existing.name,
          accountId,
        });
        await this.debtsRepository.update(existing.id, {
          currentBalance: 0,
          principalPaid: paymentTotal,
          isPaidOff: true,
          paidOffAt: now,
          status: "closed",
          updatedAt: now,
        });
        await this.debtPlannedPaymentsService.cancelScheduledPlannedPaymentsForDebt(
          existing.id,
          accessToken,
          refreshToken
        );
      }
      return;
    }

    if (!existing) {
      logger.info("[CreditCardDebtFlow] syncForAccount – creating new debt", {
        accountId,
        accountName: account.name,
        currentBalance: balance,
      });
      const householdId = await getActiveHouseholdId(userId);
      const newDebt = await this.debtsService.createCreditCardDebtFromAccount({
        accountId,
        accountName: account.name,
        currentBalance: balance,
        principalPaid: paymentTotal,
        userId,
        householdId,
      });
      logger.info("[CreditCardDebtFlow] syncForAccount – debt created", {
        debtId: newDebt.id,
        debtCurrentBalance: newDebt.currentBalance,
      });
      await this.debtPlannedPaymentsService.upsertCreditCardPlannedPayment(
        {
          id: newDebt.id,
          name: newDebt.name,
          accountId: newDebt.accountId!,
          currentBalance: newDebt.currentBalance,
          interestRate: newDebt.interestRate,
        },
        { dueDayOfMonth: account.due_day_of_month ?? null },
        accessToken,
        refreshToken
      );
      return;
    }

    logger.info("[CreditCardDebtFlow] syncForAccount – updating existing debt", {
      debtId: existing.id,
      newCurrentBalance: balance,
    });
    await this.debtsRepository.update(existing.id, {
      currentBalance: balance,
      principalPaid: paymentTotal,
      isPaidOff: false,
      paidOffAt: null,
      status: "active",
      updatedAt: now,
    });

    await this.debtPlannedPaymentsService.upsertCreditCardPlannedPayment(
      {
        id: existing.id,
        name: existing.name,
        accountId: existing.account_id!,
        currentBalance: balance,
        interestRate: existing.interest_rate,
      },
      { dueDayOfMonth: account.due_day_of_month ?? null },
      accessToken,
      refreshToken
    );
  }
}
