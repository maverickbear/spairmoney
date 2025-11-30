import { z } from "zod";

/**
 * Promo code validation schemas
 */
export const createPromoCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
  discountType: z.enum(["percent", "fixed"], {
    errorMap: () => ({ message: "Discount type must be 'percent' or 'fixed'" }),
  }),
  discountValue: z.number().positive("Discount value must be positive"),
  duration: z.enum(["once", "forever", "repeating"], {
    errorMap: () => ({ message: "Duration must be 'once', 'forever', or 'repeating'" }),
  }),
  durationInMonths: z.number().positive().optional().nullable(),
  maxRedemptions: z.number().positive().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  planIds: z.array(z.string()).optional().default([]),
});

export const updatePromoCodeSchema = z.object({
  id: z.string().min(1, "ID is required"),
  code: z.string().min(1).optional(),
  discountType: z.enum(["percent", "fixed"]).optional(),
  discountValue: z.number().positive().optional(),
  duration: z.enum(["once", "forever", "repeating"]).optional(),
  durationInMonths: z.number().positive().optional().nullable(),
  maxRedemptions: z.number().positive().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  planIds: z.array(z.string()).optional(),
});

export type CreatePromoCodeFormData = z.infer<typeof createPromoCodeSchema>;
export type UpdatePromoCodeFormData = z.infer<typeof updatePromoCodeSchema>;

