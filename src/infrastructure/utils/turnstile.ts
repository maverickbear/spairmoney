/**
 * Cloudflare Turnstile validation utility
 * Validates Turnstile tokens server-side
 */

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verifies a Turnstile token with Cloudflare's API
 * @param token - The Turnstile token to verify
 * @param remoteIp - Optional client IP address
 * @returns Promise with validation result
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If secret key is not configured, skip validation (for development)
  if (!secretKey) {
    console.warn("[Turnstile] TURNSTILE_SECRET_KEY not configured, skipping validation");
    return { success: true };
  }

  // If token is missing, fail validation
  if (!token) {
    return {
      success: false,
      error: "Security verification token is missing",
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      console.error("[Turnstile] Verification request failed:", response.status, response.statusText);
      return {
        success: false,
        error: "Failed to verify security token",
      };
    }

    const data: TurnstileVerifyResponse = await response.json();

    if (!data.success) {
      const errorCodes = data["error-codes"] || [];
      console.error("[Turnstile] Token validation failed:", errorCodes);
      
      // Map common error codes to user-friendly messages
      let errorMessage = "Security verification failed";
      if (errorCodes.includes("invalid-input-response")) {
        errorMessage = "Invalid security token";
      } else if (errorCodes.includes("timeout-or-duplicate")) {
        errorMessage = "Security token expired. Please try again";
      } else if (errorCodes.includes("invalid-input-secret")) {
        errorMessage = "Security verification configuration error";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[Turnstile] Error verifying token:", error);
    return {
      success: false,
      error: "Failed to verify security token",
    };
  }
}

/**
 * Gets the client IP address from a Next.js request
 * @param request - Next.js request object
 * @returns Client IP address or undefined
 */
export function getClientIp(request: Request): string | undefined {
  // Try various headers that might contain the client IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return undefined;
}

