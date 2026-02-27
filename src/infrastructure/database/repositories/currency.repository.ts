/**
 * Currency Repository
 * Data access for supported display currencies (currencies table).
 * Falls back to domain constants if table is missing or empty.
 */

import { createServerClient, createServiceRoleClient } from "../supabase-server";
import { logger } from "@/src/infrastructure/utils/logger";
import type { DisplayCurrencyOption } from "@/src/domain/currency/currency.types";
import {
  DEFAULT_DISPLAY_CURRENCY,
  SUPPORTED_DISPLAY_CURRENCIES_FALLBACK,
} from "@/src/domain/currency/currency.constants";

/** Full row from DB for admin (includes is_active). */
export interface CurrencyRow {
  code: string;
  name: string;
  locale: string;
  isActive: boolean;
  sortOrder: number;
}

export class CurrencyRepository {
  /**
   * List active display currencies (for dropdown / validation).
   * Reads from public.currencies; on error or empty, returns fallback list from domain constants.
   */
  async listActive(
    accessToken?: string,
    refreshToken?: string
  ): Promise<DisplayCurrencyOption[]> {
    try {
      const supabase = await createServerClient(accessToken, refreshToken);
      const { data: rows, error } = await supabase
        .from("currencies")
        .select("code, name, locale, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        logger.warn("[CurrencyRepository] listActive error, using fallback:", error.message);
        return this.getFallbackOptions();
      }

      if (!rows?.length) {
        return this.getFallbackOptions();
      }

      return rows.map((r) => ({
        code: r.code,
        name: r.name,
        locale: r.locale,
        sortOrder: r.sort_order,
      }));
    } catch (e) {
      logger.warn("[CurrencyRepository] listActive exception, using fallback:", e);
      return this.getFallbackOptions();
    }
  }

  /**
   * Return list of allowed currency codes (for validation).
   * Uses DB list when available; otherwise fallback constants.
   */
  async getAllowedCodes(
    accessToken?: string,
    refreshToken?: string
  ): Promise<string[]> {
    const options = await this.listActive(accessToken, refreshToken);
    return options.map((o) => o.code);
  }

  /**
   * List all currencies (for admin). Includes inactive. Uses service role to bypass RLS.
   */
  async listAllForAdmin(): Promise<CurrencyRow[]> {
    const supabase = createServiceRoleClient();
    const { data: rows, error } = await supabase
      .from("currencies")
      .select("code, name, locale, is_active, sort_order")
      .order("sort_order", { ascending: true })
      .order("code", { ascending: true });

    if (error) {
      logger.error("[CurrencyRepository] listAllForAdmin error:", error);
      throw new Error(`Failed to list currencies: ${error.message}`);
    }

    return (rows ?? []).map((r) => ({
      code: r.code,
      name: r.name,
      locale: r.locale,
      isActive: r.is_active,
      sortOrder: r.sort_order,
    }));
  }

  /**
   * Create a new currency. Fails if code already exists.
   */
  async create(data: {
    code: string;
    name: string;
    locale: string;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<CurrencyRow> {
    const supabase = createServiceRoleClient();
    const { data: row, error } = await supabase
      .from("currencies")
      .insert({
        code: data.code.toUpperCase(),
        name: data.name,
        locale: data.locale,
        is_active: data.isActive ?? true,
        sort_order: data.sortOrder ?? 999,
      })
      .select("code, name, locale, is_active, sort_order")
      .single();

    if (error) {
      logger.error("[CurrencyRepository] create error:", error);
      throw new Error(`Failed to create currency: ${error.message}`);
    }

    return {
      code: row.code,
      name: row.name,
      locale: row.locale,
      isActive: row.is_active,
      sortOrder: row.sort_order,
    };
  }

  /**
   * Update an existing currency by code. Cannot change code.
   */
  async update(
    code: string,
    data: { name?: string; locale?: string; isActive?: boolean; sortOrder?: number }
  ): Promise<CurrencyRow> {
    const supabase = createServiceRoleClient();
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = { updated_at: now };
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.locale !== undefined) updatePayload.locale = data.locale;
    if (data.isActive !== undefined) updatePayload.is_active = data.isActive;
    if (data.sortOrder !== undefined) updatePayload.sort_order = data.sortOrder;

    const { data: row, error } = await supabase
      .from("currencies")
      .update(updatePayload)
      .eq("code", code.toUpperCase())
      .select("code, name, locale, is_active, sort_order")
      .single();

    if (error) {
      logger.error("[CurrencyRepository] update error:", error);
      throw new Error(`Failed to update currency: ${error.message}`);
    }

    return {
      code: row.code,
      name: row.name,
      locale: row.locale,
      isActive: row.is_active,
      sortOrder: row.sort_order,
    };
  }

  private getFallbackOptions(): DisplayCurrencyOption[] {
    const labels: Record<string, string> = {
      CAD: "Canadian Dollar",
      USD: "US Dollar",
    };
    return SUPPORTED_DISPLAY_CURRENCIES_FALLBACK.map((code, index) => ({
      code,
      name: labels[code] ?? code,
      locale: code === "CAD" ? "en-CA" : "en-US",
      sortOrder: index,
    }));
  }
}

/** Default display currency when household has none set. */
export function getDefaultDisplayCurrency(): string {
  return DEFAULT_DISPLAY_CURRENCY;
}
