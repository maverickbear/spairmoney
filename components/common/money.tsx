/**
 * Formats a monetary amount as currency (CAD)
 * Handles edge cases: undefined, null, NaN, and ensures 0 displays as $0.00
 * 
 * @param amount - The amount to format (can be number, string, null, or undefined)
 * @returns Formatted currency string (e.g., "$0.00", "$1,234.56")
 */
export function formatMoney(amount: number | string | null | undefined): string {
  // Handle null, undefined, or empty string
  if (amount == null || amount === '') {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);
  }

  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

  // Handle NaN or invalid numbers
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);
  }

  // Format the valid number
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

export function Money({ amount }: { amount: number }) {
  return <span>{formatMoney(amount)}</span>;
}

