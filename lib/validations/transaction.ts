import { z } from "zod";

export const transactionSchema = z.object({
  date: z.date(),
  type: z.enum(["expense", "income"]),
  amount: z.number().positive("Amount must be positive"),
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  description: z.string().optional(),
  recurring: z.boolean().default(false),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

