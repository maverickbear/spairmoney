/**
 * Accounts Mapper
 * Maps between domain entities and infrastructure DTOs
 */

import { BaseAccount, AccountWithBalance, AccountOwnerInfo } from "../../domain/accounts/accounts.types";
import { AccountRow } from "@/src/infrastructure/database/repositories/accounts.repository";

/** Coerce Supabase numeric (often returned as string in JSON) to number or null */
function toNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

/** Coerce to integer 1-31 for due_day_of_month */
function toDueDay(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null;
}

/** Ensure type is lowercase string (Supabase returns text; keep enum shape for app) */
function toAccountType(value: unknown): BaseAccount["type"] {
  const s = typeof value === "string" ? value.trim().toLowerCase() : "";
  const valid: BaseAccount["type"][] = ["cash", "checking", "savings", "credit", "investment", "other"];
  return valid.includes(s as BaseAccount["type"]) ? (s as BaseAccount["type"]) : "other";
}

export class AccountsMapper {
  /**
   * Map repository row to domain entity.
   * Supabase returns numeric columns as strings in JSON; we coerce to number so the API and form get consistent types.
   */
  static toDomain(row: AccountRow): BaseAccount {
    return {
      id: row.id,
      name: row.name,
      type: toAccountType(row.type),
      userId: row.user_id,
      creditLimit: toNumber(row.credit_limit),
      initialBalance: toNumber(row.initial_balance),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      dueDayOfMonth: toDueDay(row.due_day_of_month),
      extraCredit: Number(row.extra_credit) || 0,
      isDefault: Boolean(row.is_default),
    };
  }

  /**
   * Map domain entity to repository row
   */
  static toRepository(domain: Partial<BaseAccount & { householdId?: string | null }>): Partial<AccountRow> {
    return {
      id: domain.id,
      name: domain.name,
      type: domain.type,
      user_id: domain.userId ?? null,
      household_id: domain.householdId ?? null,
      credit_limit: domain.creditLimit ?? null,
      initial_balance: domain.initialBalance ?? null,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
      due_day_of_month: domain.dueDayOfMonth ?? null,
      extra_credit: domain.extraCredit ?? 0,
    };
  }

  /**
   * Map repository rows to domain entities with balance
   * @param ownerDetailsMap - optional map of ownerId -> { name, avatarUrl } for building owners[]
   */
  static toDomainWithBalance(
    rows: AccountRow[],
    balances: Map<string, number>,
    ownerIdsMap: Map<string, string[]>,
    householdNamesMap: Map<string, string>,
    ownerDetailsMap?: Map<string, { name: string | null; avatarUrl: string | null }>
  ): AccountWithBalance[] {
    return rows.map(row => {
      const ownerIds = ownerIdsMap.get(row.id) || (row.user_id ? [row.user_id] : []);
      const householdName = ownerIds
        .map(ownerId => householdNamesMap.get(ownerId))
        .filter(Boolean)
        .join(", ") || null;

      const owners: AccountOwnerInfo[] | undefined = ownerDetailsMap && ownerIds.length > 0
        ? ownerIds.map(ownerId => {
            const details = ownerDetailsMap.get(ownerId);
            return {
              id: ownerId,
              name: details?.name ?? null,
              avatarUrl: details?.avatarUrl ?? null,
            };
          })
        : undefined;

      return {
        ...this.toDomain(row),
        balance: balances.get(row.id) || 0,
        householdName,
        ownerIds,
        ...(owners && owners.length > 0 ? { owners } : {}),
      };
    });
  }
}

