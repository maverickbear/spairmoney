/**
 * Currency Domain Validations
 * Zod schemas for display currency (code validated against allowed list at runtime).
 */

import { z } from "zod";

/** Schema for a single currency code string (e.g. "CAD", "USD"). Validation against allowed list is done in application layer. */
export const currencyCodeSchema = z
  .string()
  .length(3, "Currency code must be 3 characters (ISO 4217)")
  .toUpperCase();

/** Schema for PATCH household settings body when updating display currency. */
export const displayCurrencyUpdateSchema = z.object({
  displayCurrency: currencyCodeSchema.optional().nullable(),
});

export type DisplayCurrencyUpdateInput = z.infer<
  typeof displayCurrencyUpdateSchema
>;

/** Admin: create currency. */
export const createCurrencySchema = z.object({
  code: currencyCodeSchema,
  name: z.string().min(1, "Name is required"),
  locale: z.string().min(2, "Locale is required (e.g. en-CA)"),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(999),
});

/** Admin: update currency (code in URL/query; body has optional fields). */
export const updateCurrencySchema = z.object({
  name: z.string().min(1).optional(),
  locale: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateCurrencyInput = z.infer<typeof createCurrencySchema>;
export type UpdateCurrencyInput = z.infer<typeof updateCurrencySchema>;
