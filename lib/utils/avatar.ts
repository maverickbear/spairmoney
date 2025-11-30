/**
 * Utility functions for handling user avatars
 */

/**
 * Get user initials from name
 * @param name - User's full name
 * @returns Initials (e.g., "John Doe" -> "JD", "John" -> "J", null -> "U")
 */
export function getInitials(name: string | undefined | null): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name[0].toUpperCase();
}

/**
 * Validate if an avatar URL is valid
 * @param url - Avatar URL to validate
 * @returns true if URL is valid, false otherwise
 */
export function isValidAvatarUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "na" || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") {
    return false;
  }
  // Check if it's a valid URL
  try {
    const urlObj = new URL(trimmed);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    // If it's not a full URL, check if it starts with / (relative path) or data: (data URI)
    // Also accept URLs that look like Supabase storage URLs even if they don't parse as URL
    if (trimmed.startsWith("/") || trimmed.startsWith("data:")) {
      return true;
    }
    // Check if it looks like a URL (contains http:// or https://)
    if (trimmed.includes("http://") || trimmed.includes("https://")) {
      return true;
    }
    return false;
  }
}

