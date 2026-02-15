/**
 * Only this domain is allowed for admin registration and invites.
 * Used by domain validation and application layer.
 * Security: do not derive from env or user input; hardcoded to prevent bypass.
 */
export const ADMIN_ALLOWED_EMAIL_DOMAIN = "spair.co" as const;
