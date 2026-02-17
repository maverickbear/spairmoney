/**
 * Format transfer transaction for display as a single line.
 * Used when showing one transaction per transfer (outgoing leg only).
 */

/**
 * Returns the display label for a transfer: "Transfer From: {source} → To: {destination}"
 */
export function formatTransferLabel(fromAccountName: string, toAccountName: string): string {
  const from = fromAccountName || "Unknown";
  const to = toAccountName || "Unknown";
  return `Transfer From: ${from} → To: ${to}`;
}
