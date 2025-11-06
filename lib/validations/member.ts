import { z } from "zod";

export const memberInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  role: z.enum(["admin", "member"]).optional().default("member"),
});

export type MemberInviteFormData = z.infer<typeof memberInviteSchema>;

export const memberUpdateSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  role: z.enum(["admin", "member"]).optional(),
});

export type MemberUpdateFormData = z.infer<typeof memberUpdateSchema>;



