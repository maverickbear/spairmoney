"use server";

import { createServerClient } from "@/lib/supabase-server";
import { formatTimestamp } from "@/lib/utils/timestamp";

export interface MarketPrice {
  symbol: string;
  price: number;
  change?: number;
  changePercent?: number;
}

/**
 * Fetch real-time price from Yahoo Finance API
 * This is a free, no-auth required endpoint
 * Supports stocks (AAPL), ETFs (SPY), and crypto (BTC-USD)
 */
export async function fetchYahooFinancePrice(symbol: string): Promise<number | null> {
  try {
    // Normalize symbol for Yahoo Finance
    // Crypto symbols should be in format BTC-USD, ETH-USD, etc.
    let normalizedSymbol = symbol.toUpperCase();
    
    // If it's a crypto symbol (like BTC, ETH), convert to BTC-USD format
    const cryptoPattern = /^(BTC|ETH|BNB|ADA|SOL|XRP|DOT|DOGE|AVAX|MATIC|LINK|UNI|LTC|ALGO|ATOM|VET|FIL|TRX|EOS|XLM|AAVE|MKR|COMP|SUSHI|CRV|YFI|SNX|GRT|ENJ|MANA|SAND|AXS|CHZ|FLOW|NEAR|FTM|ONE|HBAR|ICP|THETA|ZIL|ZEC|DASH|XMR|BCH|BSV|ETC|ZEC)$/i;
    if (cryptoPattern.test(normalizedSymbol) && !normalizedSymbol.includes('-')) {
      normalizedSymbol = `${normalizedSymbol}-USD`;
    }
    
    // Yahoo Finance API endpoint (no auth required)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}?interval=1d&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      console.error(`Failed to fetch price for ${symbol} (${normalizedSymbol}): ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // Check for errors in response
    if (data?.chart?.error) {
      console.error(`Yahoo Finance error for ${symbol}:`, data.chart.error);
      return null;
    }
    
    if (!data?.chart?.result?.[0]) {
      console.error(`No data found for ${symbol} (${normalizedSymbol})`);
      return null;
    }
    
    const result = data.chart.result[0];
    const meta = result.meta;
    
    if (meta?.regularMarketPrice) {
      return meta.regularMarketPrice;
    }

    // Fallback to current price
    if (meta?.currentPrice) {
      return meta.currentPrice;
    }

    // Fallback to previous close if regular market price not available
    if (meta?.previousClose) {
      return meta.previousClose;
    }

    console.error(`No price data found for ${symbol} (${normalizedSymbol})`);
    return null;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch real-time prices for multiple symbols
 */
export async function fetchMultiplePrices(symbols: string[]): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();

  // Fetch prices sequentially to avoid rate limiting
  for (const symbol of symbols) {
    const price = await fetchYahooFinancePrice(symbol);
    if (price !== null && price > 0) {
      priceMap.set(symbol, price);
    }
    // Small delay to avoid rate limiting (100ms between requests)
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return priceMap;
}

/**
 * Update prices for all securities in the database
 */
export async function updateAllSecurityPrices() {
  const supabase = createServerClient();

  // Get all securities
  const { data: securities, error: securitiesError } = await supabase
    .from("Security")
    .select("id, symbol");

  if (securitiesError || !securities || securities.length === 0) {
    console.error("Error fetching securities:", securitiesError);
    return { updated: 0, errors: [] };
  }

  const symbols = securities.map((s) => s.symbol);
  const priceMap = await fetchMultiplePrices(symbols);

  const now = formatTimestamp(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = formatTimestamp(today);

  let updated = 0;
  const errors: string[] = [];

  // Update prices for each security
  for (const security of securities) {
    const price = priceMap.get(security.symbol);
    
    if (price === undefined || price === null) {
      errors.push(`${security.symbol}: No price found`);
      continue;
    }
    
    if (price <= 0) {
      errors.push(`${security.symbol}: Invalid price (${price})`);
      continue;
    }

    // Check if price already exists for today
    const { data: existingPrice } = await supabase
      .from("SecurityPrice")
      .select("id")
      .eq("securityId", security.id)
      .eq("date", todayTimestamp)
      .single();

    if (existingPrice) {
      // Update existing price
      const { error: updateError } = await supabase
        .from("SecurityPrice")
        .update({ price })
        .eq("id", existingPrice.id);

      if (updateError) {
        errors.push(`Failed to update price for ${security.symbol}: ${updateError.message}`);
      } else {
        updated++;
      }
    } else {
      // Create new price entry
      const id = crypto.randomUUID();
      const { error: insertError } = await supabase
        .from("SecurityPrice")
        .insert({
          id,
          securityId: security.id,
          date: todayTimestamp,
          price,
          createdAt: now,
        });

      if (insertError) {
        errors.push(`Failed to create price for ${security.symbol}: ${insertError.message}`);
      } else {
        updated++;
      }
    }
  }

  return { updated, errors };
}

/**
 * Update price for a specific security
 */
export async function updateSecurityPrice(securityId: string, symbol: string) {
  const supabase = createServerClient();

  const price = await fetchYahooFinancePrice(symbol);
  
  if (price === null) {
    throw new Error(`Failed to fetch price for ${symbol}`);
  }

  const now = formatTimestamp(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = formatTimestamp(today);

  // Check if price already exists for today
  const { data: existingPrice } = await supabase
    .from("SecurityPrice")
    .select("id")
    .eq("securityId", securityId)
    .eq("date", todayTimestamp)
    .single();

  if (existingPrice) {
    // Update existing price
    const { error } = await supabase
      .from("SecurityPrice")
      .update({ price })
      .eq("id", existingPrice.id);

    if (error) {
      throw new Error(`Failed to update price: ${error.message}`);
    }

    return { id: existingPrice.id, price, date: todayTimestamp };
  } else {
    // Create new price entry
    const id = crypto.randomUUID();
    const { data, error } = await supabase
      .from("SecurityPrice")
      .insert({
        id,
        securityId,
        date: todayTimestamp,
        price,
        createdAt: now,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create price: ${error.message}`);
    }

    return data;
  }
}

