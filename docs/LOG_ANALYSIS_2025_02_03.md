# Log Analysis - Dashboard Performance Issues
**Date:** 2025-02-03  
**Analysis of:** Terminal logs lines 1-126

## 🔍 Key Findings

### 1. **Subscription Cache Expiration Issue** ⚠️ HIGH PRIORITY

**Problem:**
- Subscription cache in User table is **71,545 seconds old** (~20 hours)
- Cache threshold is **5 minutes** (300 seconds)
- System falls back to full query on every request

**Log Evidence:**
```
[SUBSCRIPTION] Cache expired, falling back to full query {
  userId: '1ec89f1f-ff6b-4079-bd8e-0a159a94c235',
  cacheAge: '71545s',
  reason: 'too_old'
}
```

**Root Cause:**
The `subscriptionUpdatedAt` field in the User table hasn't been updated in ~20 hours. The cache should be refreshed:
- When subscriptions are created/updated (via triggers)
- When household members are added/removed
- When subscription status changes

**Impact:**
- Every subscription check requires a full database query instead of using cached data
- Slower response times for subscription-dependent features
- Unnecessary database load

**Recommendations:**
1. **Immediate Fix:** Manually refresh cache for affected users:
   ```sql
   SELECT update_user_subscription_cache('1ec89f1f-ff6b-4079-bd8e-0a159a94c235');
   ```

2. **Verify Triggers:** Ensure subscription cache triggers are working:
   ```sql
   -- Check if trigger exists
   SELECT * FROM pg_trigger WHERE tgname = 'subscription_cache_update_trigger';
   
   -- Check trigger function
   SELECT * FROM pg_proc WHERE proname = 'trigger_update_subscription_cache';
   ```

3. **Add Monitoring:** Log when cache updates fail or are skipped

4. **Background Job:** Consider a periodic job to refresh stale caches (>1 hour old)

---

### 2. **Portfolio API Performance** ⚠️ MEDIUM PRIORITY

**Problem:**
- `/api/portfolio/all?days=30` takes **2.3-2.4 seconds** to render
- Endpoint is called **twice** (lines 124-125)
- Request deduplication cache (2s TTL) isn't preventing duplicate calls

**Log Evidence:**
```
GET /api/portfolio/all?days=30 200 in 2.4s (compile: 4ms, proxy.ts: 418ms, render: 1935ms)
GET /api/portfolio/all?days=30 200 in 2.3s (compile: 2ms, proxy.ts: 423ms, render: 1838ms)
```

**Root Cause:**
- Two separate requests are being made (likely from different components)
- The 2-second cache TTL is too short to catch these parallel requests
- The requests start at nearly the same time, so both miss the cache

**Impact:**
- Duplicate work: same expensive query executed twice
- Slower page load times
- Unnecessary database/API load

**Recommendations:**
1. **Increase Cache TTL:** Extend from 2 seconds to 5-10 seconds
   ```typescript
   const CACHE_TTL = 5000; // 5 seconds instead of 2000
   ```

2. **Investigate Duplicate Calls:** Find where both calls originate:
   - Check dashboard page components
   - Check if multiple components are calling the same endpoint
   - Consider using React Query or SWR for client-side deduplication

3. **Optimize Query Performance:** The 1.8-1.9s render time suggests slow queries:
   - Review `getPortfolioInternalData()` performance
   - Check Questrade API call times
   - Consider adding database indexes

4. **Add Request Deduplication Logging:**
   ```typescript
   if (cached && (now - cached.timestamp) < CACHE_TTL) {
     log.debug("Reusing cached portfolio request", { cacheKey, age: now - cached.timestamp });
     // ...
   }
   ```

---

### 3. **Subscription Status Check** ✅ WORKING AS EXPECTED

**Status:** System correctly identifies trialing subscription:
```
[PROTECTED-LAYOUT] Subscription check result: {
  hasSubscription: true,
  subscriptionId: '1ec89f1f-ff6b-4079-bd8e-0a159a94c235-pro',
  planId: 'pro',
  status: 'trialing',
  userId: '1ec89f1f-ff6b-4079-bd8e-0a159a94c235'
}
```

**Note:** Even though cache is expired, the fallback query works correctly.

---

### 4. **Dashboard Load Performance** ✅ GOOD

**Status:** Dashboard page loads in **317ms**, which is excellent:
```
[PERF-DASHBOARD] [Dashboard] Page loaded in 317ms
```

**Note:** This is the initial page load. API calls happen after render.

---

### 5. **Account and Subscription Data** ✅ WORKING

**Status:** 
- 3 accounts found
- 3 subscriptions found (Spotify, Google One, ChatGPT Plus)
- All data loading correctly

---

## 📊 Performance Summary

| Metric | Value | Status |
|--------|-------|--------|
| Dashboard Page Load | 317ms | ✅ Excellent |
| Subscription API | 1407ms | ⚠️ Slow (cache miss) |
| Portfolio API (1st call) | 2400ms | ⚠️ Slow |
| Portfolio API (2nd call) | 2300ms | ⚠️ Slow (duplicate) |
| Check Updates API | 672ms | ✅ Acceptable |

---

## 🎯 Action Items

### Immediate (High Priority)
1. ✅ **Refresh subscription cache** for affected users
2. ✅ **Verify subscription cache triggers** are active and working
3. ✅ **Investigate duplicate portfolio API calls** - find source

### Short-term (Medium Priority)
4. ⏳ **Increase portfolio cache TTL** from 2s to 5-10s
5. ⏳ **Add logging** for cache hits/misses
6. ⏳ **Optimize portfolio query performance** (investigate 1.8s render time)

### Long-term (Low Priority)
7. ⏳ **Add background job** to refresh stale subscription caches
8. ⏳ **Consider client-side request deduplication** (React Query/SWR)
9. ⏳ **Add performance monitoring** for API endpoints

---

## 🔧 Code Changes Needed

### 1. Fix Subscription Cache Refresh

**File:** `lib/api/subscription.ts`

Add automatic cache refresh when cache is too old:
```typescript
// After line 280, add:
if (cacheAge > 60 * 60 * 1000) { // > 1 hour
  // Cache is very stale, refresh it in background
  supabase.rpc('update_user_subscription_cache', { p_user_id: userId })
    .catch(err => log.warn("Failed to refresh stale cache:", err));
}
```

### 2. Increase Portfolio Cache TTL

**File:** `app/api/portfolio/all/route.ts`

```typescript
const CACHE_TTL = 5000; // 5 seconds instead of 2000
```

### 3. Add Cache Hit Logging

**File:** `app/api/portfolio/all/route.ts`

```typescript
if (cached && (now - cached.timestamp) < CACHE_TTL) {
  console.log(`[Portfolio All] Cache hit: ${cacheKey}, age: ${now - cached.timestamp}ms`);
  const data = await cached.promise;
  return NextResponse.json(data);
}
```

---

## 📝 Notes

- The subscription cache expiration is the most critical issue as it affects every request
- Portfolio API duplication is less critical but still wastes resources
- Overall dashboard performance is good (317ms), but API calls after render are slow
- Consider implementing request-level caching or using a shared state management solution

