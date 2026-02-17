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
   */
  async syncForAccount(
    accountId: string,
    userId: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<void> {
    const account = await this.accountsRepository.findById(accountId, accessToken, refreshToken);
    if (!account || account.type !== "credit") {
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
    const balance = Math.max(0, expenseTotal - paymentTotal);

    const existing = await this.debtsRepository.findByAccountIdAndLoanType(
      accountId,
      "credit_card",
      accessToken,
      refreshToken
    );

    const now = formatTimestamp(new Date());

    if (balance <= 0) {
      if (existing) {
        await this.debtsRepository.update(existing.id, {
          currentBalance: 0,
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
      const householdId = await getActiveHouseholdId(userId);
      const newDebt = await this.debtsService.createCreditCardDebtFromAccount({
        accountId,
        accountName: account.name,
        currentBalance: balance,
        userId,
        householdId,
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

    await this.debtsRepository.update(existing.id, {
      currentBalance: balance,
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
