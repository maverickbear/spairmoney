/**
 * File validation utilities for secure file uploads
 */

/**
 * Allowed image MIME types
 */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

/**
 * Allowed file extensions
 */
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"] as const;

/**
 * Magic bytes (file signatures) for image types
 */
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header, need to check for WEBP further
};

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and dangerous characters
  let sanitized = filename
    .replace(/[\/\\]/g, "") // Remove path separators
    .replace(/\.\./g, "") // Remove parent directory references
    .replace(/[<>:"|?*]/g, "") // Remove Windows reserved characters
    .replace(/[\x00-\x1f\x7f]/g, ""); // Remove control characters

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split(".").pop();
    sanitized = sanitized.substring(0, 255 - (ext?.length || 0) - 1) + "." + ext;
  }

  return sanitized;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string | null {
  const parts = filename.split(".");
  if (parts.length < 2) {
    return null;
  }
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Validate file extension
 */
export function validateFileExtension(extension: string | null): boolean {
  if (!extension) {
    return false;
  }
  return ALLOWED_EXTENSIONS.includes(extension.toLowerCase() as any);
}

/**
 * Validate MIME type
 */
export function validateMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase() as any);
}

/**
 * Check if buffer matches magic bytes for a given MIME type
 */
function checkMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) {
    return false;
  }

  for (const signature of signatures) {
    if (buffer.length < signature.length) {
      continue;
    }

    let matches = true;
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      // For WebP, need to check for "WEBP" string at offset 8
      if (mimeType === "image/webp" && buffer.length >= 12) {
        const webpString = buffer.toString("ascii", 8, 12);
        return webpString === "WEBP";
      }
      return true;
    }
  }

  return false;
}

/**
 * Detect MIME type from magic bytes
 */
export function detectMimeTypeFromMagicBytes(buffer: Buffer): string | null {
  for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const signature of signatures) {
      if (buffer.length < signature.length) {
        continue;
      }

      let matches = true;
      for (let i = 0; i < signature.length; i++) {
        if (buffer[i] !== signature[i]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        // For WebP, need to check for "WEBP" string at offset 8
        if (mimeType === "image/webp" && buffer.length >= 12) {
          const webpString = buffer.toString("ascii", 8, 12);
          if (webpString === "WEBP") {
            return mimeType;
          }
        } else {
          return mimeType;
        }
      }
    }
  }

  return null;
}

/**
 * Validate file content using magic bytes
 */
export function validateFileContent(buffer: Buffer, declaredMimeType: string): boolean {
  // Check magic bytes match declared MIME type
  if (!checkMagicBytes(buffer, declaredMimeType)) {
    return false;
  }

  // Also check if detected MIME type matches declared type
  const detectedMimeType = detectMimeTypeFromMagicBytes(buffer);
  if (detectedMimeType && detectedMimeType !== declaredMimeType) {
    return false;
  }

  return true;
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Comprehensive file validation
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export async function validateImageFile(
  file: File,
  buffer: Buffer
): Promise<FileValidationResult> {
  // Validate file size
  if (!validateFileSize(file.size)) {
    return {
      valid: false,
      error: `File size must be between 1 byte and ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Validate MIME type
  if (!validateMimeType(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }

  // Validate file extension
  const extension = getFileExtension(file.name);
  if (!validateFileExtension(extension)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  // Validate magic bytes
  if (!validateFileContent(buffer, file.type)) {
    return {
      valid: false,
      error: "File content does not match declared file type. Possible file type mismatch or corrupted file.",
    };
  }

  return { valid: true };
}

