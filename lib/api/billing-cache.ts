// Shared cache for billing data across the application
// This prevents duplicate API calls to /api/billing/subscription

export interface BillingCacheData {
  subscription: any | null;
  plan: any | null;
  limits: any | null;
  transactionLimit: any | null;
  accountLimit: any | null;
  interval: "month" | "year" | null;
}

export const billingDataCache = {
  data: null as BillingCacheData | null,
  promise: null as Promise<BillingCacheData> | null,
  timestamp: 0,
  TTL: 30 * 1000, // 30 seconds cache - matches refresh interval
};

// Helper function to check if cache is valid
export function isBillingCacheValid(): boolean {
  const now = Date.now();
  return billingDataCache.data !== null && (now - billingDataCache.timestamp) < billingDataCache.TTL;
}

// Helper function to get cached data
export function getBillingCacheData(): BillingCacheData | null {
  if (isBillingCacheValid()) {
    return billingDataCache.data;
  }
  return null;
}

// Helper function to set cache data
export function setBillingCacheData(data: BillingCacheData): void {
  billingDataCache.data = data;
  billingDataCache.timestamp = Date.now();
}

// Helper function to get or create in-flight promise
// CRITICAL: This function ensures only ONE API call is made at a time
// Multiple components calling this simultaneously will share the same promise
export function getOrCreateBillingPromise(
  fetchFn: () => Promise<BillingCacheData>
): Promise<BillingCacheData> {
  // CRITICAL: Check for existing promise FIRST to prevent race conditions
  // If a promise already exists, return it immediately (deduplication)
  if (billingDataCache.promise) {
    return billingDataCache.promise;
  }
  
  // Check cache again (in case it was populated while we were waiting)
  if (isBillingCacheValid()) {
    return Promise.resolve(billingDataCache.data!);
  }
  
  // Create new promise and cache it
  // This ensures that if multiple components call this function simultaneously,
  // they all get the same promise and only one API call is made
  const promise = fetchFn()
    .then((result) => {
      billingDataCache.data = result;
      billingDataCache.timestamp = Date.now();
      billingDataCache.promise = null;
      return result;
    })
    .catch((error) => {
      billingDataCache.promise = null;
      throw error;
    });
  
  billingDataCache.promise = promise;
  return promise;
}

// Helper function to invalidate cache
export function invalidateBillingCache(): void {
  billingDataCache.data = null;
  billingDataCache.timestamp = 0;
  billingDataCache.promise = null;
}

