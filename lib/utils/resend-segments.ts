/**
 * Resend Contacts segment helpers.
 * Syncs users to Resend segments (active/trial vs cancelled) without failing signup or webhooks.
 */

import { Resend } from "resend";

const RESEND_SEGMENT_ACTIVE =
  process.env.RESEND_SEGMENT_ACTIVE ?? "0260f9e0-004d-4b67-b54f-a13d0c1584be";
const RESEND_SEGMENT_CANCELLED =
  process.env.RESEND_SEGMENT_CANCELLED ?? "7646ce15-bb67-43d4-9f74-7b1bb9992ff5";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Ensure contact exists in Resend and is in the active/trial segment.
 * Creates contact if needed, then adds to segment. Does not throw.
 */
export async function ensureContactInActiveSegment(
  email: string,
  firstName?: string | null
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("[RESEND-SEGMENTS] RESEND_API_KEY not set; skipping segment sync");
    return { success: false, error: "Resend not configured" };
  }

  const trimmedEmail = email?.trim();
  if (!trimmedEmail) {
    return { success: false, error: "Email is required" };
  }

  try {
    const name = firstName?.trim() || "";
    const [first = "", ...rest] = name.split(/\s+/);
    const lastName = rest.length > 0 ? rest.join(" ") : undefined;

    const { error: createError } = await resend.contacts.create({
      email: trimmedEmail,
      firstName: first || undefined,
      lastName: lastName || undefined,
      unsubscribed: false,
    });

    if (createError) {
      const msg = createError.message ?? String(createError);
      if (msg.toLowerCase().includes("already exists") || msg.includes("duplicate")) {
        // Contact exists; just add to segment
      } else {
        console.warn("[RESEND-SEGMENTS] ensureContactInActiveSegment create failed:", msg);
        return { success: false, error: msg };
      }
    }

    const { error: addError } = await resend.contacts.segments.add({
      email: trimmedEmail,
      segmentId: RESEND_SEGMENT_ACTIVE,
    });

    if (addError) {
      const msg = addError.message ?? String(addError);
      console.warn("[RESEND-SEGMENTS] ensureContactInActiveSegment add to segment failed:", msg);
      return { success: false, error: msg };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[RESEND-SEGMENTS] ensureContactInActiveSegment error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Remove contact from active segment and add to cancelled segment.
 * If contact does not exist in Resend, creates it and adds only to cancelled segment. Does not throw.
 */
export async function moveContactToCancelledSegment(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("[RESEND-SEGMENTS] RESEND_API_KEY not set; skipping segment sync");
    return { success: false, error: "Resend not configured" };
  }

  const trimmedEmail = email?.trim();
  if (!trimmedEmail) {
    return { success: false, error: "Email is required" };
  }

  try {
    await resend.contacts.segments.remove({
      email: trimmedEmail,
      segmentId: RESEND_SEGMENT_ACTIVE,
    });
    // Ignore remove error (e.g. contact not in segment)
  } catch {
    // Ignore
  }

  const { error: createError } = await resend.contacts.create({
    email: trimmedEmail,
    unsubscribed: false,
  });

  if (createError) {
    const msg = createError.message ?? String(createError);
    if (!msg.toLowerCase().includes("already exists") && !msg.includes("duplicate")) {
      console.warn("[RESEND-SEGMENTS] moveContactToCancelledSegment create failed:", msg);
    }
  }

  const { error: addError } = await resend.contacts.segments.add({
    email: trimmedEmail,
    segmentId: RESEND_SEGMENT_CANCELLED,
  });

  if (addError) {
    const msg = addError.message ?? String(addError);
    console.warn("[RESEND-SEGMENTS] moveContactToCancelledSegment add to cancelled failed:", msg);
    return { success: false, error: msg };
  }

  return { success: true };
}
