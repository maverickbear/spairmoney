/**
 * Credit Card Debt Sync Factory
 * Dependency injection for CreditCardDebtSyncService
 */

import { CreditCardDebtSyncService } from "./credit-card-debt-sync.service";
import { AccountsRepository } from "@/src/infrastructure/database/repositories/accounts.repository";
import { TransactionsRepository } from "@/src/infrastructure/database/repositories/transactions.repository";
import { DebtsRepository } from "@/src/infrastructure/database/repositories/debts.repository";
import { makeDebtsService } from "@/src/application/debts/debts.factory";
import { DebtPlannedPaymentsService } from "@/src/application/planned-payments/debt-planned-payments.service";

export function makeCreditCardDebtSyncService(): CreditCardDebtSyncService {
  const accountsRepository = new AccountsRepository();
  const transactionsRepository = new TransactionsRepository();
  const debtsRepository = new DebtsRepository();
  const debtsService = makeDebtsService();
  const debtPlannedPaymentsService = new DebtPlannedPaymentsService();
  return new CreditCardDebtSyncService(
    accountsRepository,
    transactionsRepository,
    debtsRepository,
    debtsService,
    debtPlannedPaymentsService
  );
}
