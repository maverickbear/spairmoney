import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  avatarUrl: z.string().url().optional().nullable().or(z.literal("")),
  phoneNumber: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
});

// Partial schema for PATCH requests (all fields optional)
export const profileUpdateSchema = profileSchema.partial();

export type ProfileFormData = z.infer<typeof profileSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

