import { z } from "zod";

export const memberInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  role: z.enum(["admin", "member"]).optional().default("member"),
});

export type MemberInviteFormData = z.infer<typeof memberInviteSchema>;

export const memberUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["admin", "member"]).optional(),
});

export type MemberUpdateFormData = z.infer<typeof memberUpdateSchema>;

export const completeInvitationSchema = z.object({
  invitationId: z.string().min(1, "Invitation ID is required"),
});

export type CompleteInvitationFormData = z.infer<typeof completeInvitationSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>;

