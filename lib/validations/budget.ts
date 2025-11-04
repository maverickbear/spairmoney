import { z } from "zod";

export const budgetSchema = z.object({
  period: z.date(),
  macroId: z.string().optional(),
  categoryId: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  amount: z.number().positive("Amount must be positive"),
  note: z.string().optional(),
}).refine(
  (data) => {
    // When editing, categoryId is required
    // When creating, either categoryId (single) or categoryIds (multiple) is required
    return data.categoryId || (data.categoryIds && data.categoryIds.length > 0);
  },
  {
    message: "At least one category must be selected",
    path: ["categoryIds"],
  }
);

export type BudgetFormData = z.infer<typeof budgetSchema>;

