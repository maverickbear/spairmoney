/**
 * Zod validations for Insights domain
 * Used to validate OpenAI response and API request/response
 */

import { z } from "zod";

export const insightCategorySchema = z.enum(["spending", "debt", "security", "habits"]);
export const insightPrioritySchema = z.enum(["high", "medium", "low"]);

export const insightItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  action: z.string(),
  priority: insightPrioritySchema,
  category: insightCategorySchema,
});

export const insightsPanoramaSchema = z.object({
  panorama: z.string(),
  insightItems: z.array(insightItemSchema),
});

export const insightsApiResponseSchema = z.object({
  panorama: z.string(),
  insightItems: z.array(insightItemSchema),
});

export const insightsMonthQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM")
    .optional(),
});

export type InsightItemInput = z.infer<typeof insightItemSchema>;
export type InsightsPanoramaInput = z.infer<typeof insightsPanoramaSchema>;
