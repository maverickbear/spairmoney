import { z } from "zod";

export const budgetSchema = z.object({
  period: z.date(),
  groupId: z.string().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  // Deprecated: Use groupId instead
  macroId: z.string().optional(),
}).refine(
  (data) => {
    // Either categoryId or groupId must be provided
    return !!(data.categoryId || data.groupId || data.macroId);
  },
  {
    message: "Either category or group must be selected",
    path: ["categoryId"],
  }
);

export type BudgetFormData = z.infer<typeof budgetSchema>;

