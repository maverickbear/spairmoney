import { z } from "zod";

export const investmentTransactionSchema = z.object({
  date: z.date(),
  accountId: z.string().min(1, "Account is required"),
  securityId: z.string().optional(),
  type: z.enum(["buy", "sell", "dividend", "interest", "transfer_in", "transfer_out"]),
  quantity: z.number().optional(),
  price: z.number().optional(),
  fees: z.number().default(0),
  notes: z.string().optional(),
});

export type InvestmentTransactionFormData = z.infer<typeof investmentTransactionSchema>;

export const securityPriceSchema = z.object({
  securityId: z.string().min(1, "Security is required"),
  date: z.date(),
  price: z.number().positive("Price must be positive"),
});

export type SecurityPriceFormData = z.infer<typeof securityPriceSchema>;

export const investmentAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"), // "tax_free", "retirement", "crypto", "brokerage", etc.
  accountId: z.string().optional().nullable(), // Optional link to Account table
});

export type InvestmentAccountFormData = z.infer<typeof investmentAccountSchema>;

