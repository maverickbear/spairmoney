import { z } from "zod";

export const securitySchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(10, "Symbol must be 10 characters or less"),
  name: z.string().min(1, "Name is required"),
  class: z.enum(["stock", "etf", "crypto", "bond", "reit"]),
});

export type SecurityFormData = z.infer<typeof securitySchema>;

