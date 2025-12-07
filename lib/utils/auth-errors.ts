/**
 * Authentication Error Utilities
 * 
 * Helper functions for handling authentication errors, including
 * HaveIBeenPwned (HIBP) password breach detection errors.
 */

/**
 * Check if an error message indicates a HIBP (HaveIBeenPwned) password breach
 * 
 * @param errorMessage - The error message to check
 * @returns true if the error is HIBP-related
 */
export function isHIBPError(errorMessage: string | undefined | null): boolean {
  if (!errorMessage) return false;
  
  const lowerMessage = errorMessage.toLowerCase();
  
  return (
    lowerMessage.includes("breach") ||
    lowerMessage.includes("pwned") ||
    lowerMessage.includes("compromised") ||
    lowerMessage.includes("leaked") ||
    lowerMessage.includes("hibp") ||
    lowerMessage.includes("haveibeenpwned")
  );
}

/**
 * Check if an error message indicates a CAPTCHA verification failure
 * 
 * @param errorMessage - The error message to check
 * @returns true if the error is CAPTCHA-related
 */
export function isCaptchaError(errorMessage: string | undefined | null): boolean {
  if (!errorMessage) return false;
  
  const lowerMessage = errorMessage.toLowerCase();
  
  return (
    lowerMessage.includes("captcha") ||
    lowerMessage.includes("verification failed") ||
    lowerMessage.includes("challenge") ||
    lowerMessage.includes("bot detection")
  );
}

/**
 * Get a user-friendly error message for authentication errors
 * 
 * @param error - The error object or message
 * @param defaultMessage - Default message if error is not recognized
 * @returns User-friendly error message
 */
export function getAuthErrorMessage(
  error: Error | { message?: string } | string | null | undefined,
  defaultMessage: string = "An authentication error occurred"
): string {
  if (!error) return defaultMessage;
  
  const errorMessage = typeof error === "string" 
    ? error 
    : error instanceof Error 
    ? error.message 
    : error.message || defaultMessage;
  
  // Check for HIBP errors first
  if (isHIBPError(errorMessage)) {
    return "This password has appeared in a data breach. Please choose a different password.";
  }
  
  // Check for CAPTCHA errors
  if (isCaptchaError(errorMessage)) {
    return "CAPTCHA verification failed. Please complete the verification again.";
  }
  
  // Check for common authentication errors
  if (errorMessage.toLowerCase().includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  
  if (errorMessage.toLowerCase().includes("email not confirmed") || 
      errorMessage.toLowerCase().includes("email_not_confirmed")) {
    return "Please confirm your email before signing in. Check your inbox for the confirmation link.";
  }
  
  if (errorMessage.toLowerCase().includes("already registered") || 
      errorMessage.toLowerCase().includes("already exists")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  
  // Return the original message if no specific handling
  return errorMessage;
}

