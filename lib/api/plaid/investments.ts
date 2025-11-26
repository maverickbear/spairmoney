"use server";

import { plaidClient } from './index';
import { createServerClient } from '@/lib/supabase-server';
import { formatTimestamp } from '@/lib/utils/timestamp';
import { InvestmentTransactionType } from 'plaid';

/**
 * Sync investment accounts, holdings, and transactions from Plaid
 */
export async function syncInvestmentAccounts(
  itemId: string,
  accessToken: string
): Promise<{
  accountsSynced: number;
  holdingsSynced: number;
  transactionsSynced: number;
  errors: number;
}> {
  const supabase = await createServerClient();
  let accountsSynced = 0;
  let holdingsSynced = 0;
  let transactionsSynced = 0;
  let errors = 0;

  try {
    // Get investment accounts from Plaid
    // Note: /accounts/get returns cached information, not real-time balances
    // For investment accounts, balances are typically calculated from holdings,
    // so we use /accounts/get for metadata and calculate balances from holdings separately
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const investmentAccounts = accountsResponse.data.accounts.filter(
      (account) => account.type === 'investment'
    );

    if (investmentAccounts.length === 0) {
      return { accountsSynced: 0, holdingsSynced: 0, transactionsSynced: 0, errors: 0 };
    }

    // Get holdings for all investment accounts
    const holdingsResponse = await plaidClient.investmentsHoldingsGet({
      access_token: accessToken,
    });

    const holdings = holdingsResponse.data.holdings || [];
    const securities = holdingsResponse.data.securities || [];

    // Get investment transactions with pagination support
    // Plaid's investmentsTransactionsGet may return paginated results for large datasets
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 730); // Last 2 years

    let allInvestmentTransactions: any[] = [];
    let hasMoreTransactions = true;
    let offset = 0;
    const pageSize = 500; // Plaid's default page size

    // Fetch all investment transactions with pagination
    while (hasMoreTransactions) {
      try {
        const transactionsResponse = await plaidClient.investmentsTransactionsGet({
          access_token: accessToken,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          options: {
            offset: offset,
            count: pageSize,
          },
        });

        const transactions = transactionsResponse.data.investment_transactions || [];
        const totalTransactions = (transactionsResponse.data as any).total_investment_transactions || transactions.length;

        allInvestmentTransactions.push(...transactions);

        // Check if there are more transactions to fetch
        if (transactions.length < pageSize || allInvestmentTransactions.length >= totalTransactions) {
          hasMoreTransactions = false;
        } else {
          offset += pageSize;
        }

        // Safety check to prevent infinite loops
        if (offset > 10000) {
          console.warn('[PLAID INVESTMENTS] Reached maximum offset limit, stopping pagination');
          hasMoreTransactions = false;
        }
      } catch (error: any) {
        // If pagination options are not supported, fall back to single request
        if (error.message?.includes('options') || error.code === 'INVALID_REQUEST' || offset === 0) {
          console.log('[PLAID INVESTMENTS] Pagination not supported or error on first request, using single request');
          try {
            const transactionsResponse = await plaidClient.investmentsTransactionsGet({
              access_token: accessToken,
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
            });
            allInvestmentTransactions = transactionsResponse.data.investment_transactions || [];
          } catch (fallbackError: any) {
            console.error('[PLAID INVESTMENTS] Error in fallback transaction fetch:', fallbackError);
            throw fallbackError;
          }
        } else {
          console.error('[PLAID INVESTMENTS] Error fetching transactions:', error);
          // If we already have some transactions, use them and continue
          if (allInvestmentTransactions.length > 0) {
            console.warn(`[PLAID INVESTMENTS] Using ${allInvestmentTransactions.length} transactions fetched before error`);
          } else {
            throw error;
          }
        }
        hasMoreTransactions = false;
      }
    }

    const investmentTransactions = allInvestmentTransactions;
    console.log(`[PLAID INVESTMENTS] Fetched ${investmentTransactions.length} investment transactions`);

    // Process each investment account
    for (const plaidAccount of investmentAccounts) {
      try {
        // Find or create the account in our database
        const { data: existingAccount } = await supabase
          .from('Account')
          .select('id')
          .eq('plaidAccountId', plaidAccount.account_id)
          .single();

        let accountId: string;

        if (existingAccount) {
          accountId = existingAccount.id;
        } else {
          // Account should have been created in exchange-public-token
          // But if it wasn't, we'll skip it
          console.warn(`Investment account not found for Plaid account ID: ${plaidAccount.account_id}`);
          continue;
        }

        accountsSynced++;

        // Process holdings for this account
        const accountHoldings = holdings.filter(
          (holding) => holding.account_id === plaidAccount.account_id
        );

        // Calculate total account value by summing all holdings
        let totalAccountValue = 0;

        for (const holding of accountHoldings) {
          try {
            // Find the security
            const security = securities.find((s) => s.security_id === holding.security_id);
            if (!security) {
              console.warn(`Security not found for holding: ${holding.security_id}`);
              continue;
            }

            // Find or create Security in our database
            let securityId: string;
            const { data: existingSecurity } = await supabase
              .from('Security')
              .select('id')
              .eq('symbol', security.ticker_symbol || security.name)
              .single();

            if (existingSecurity) {
              securityId = existingSecurity.id;
              
              // Update security with latest price and currency if available
              const updateData: any = {
                updatedAt: formatTimestamp(new Date()),
              };
              
              if ((security as any).close_price !== undefined && (security as any).close_price !== null) {
                updateData.closePrice = (security as any).close_price;
                updateData.closePriceAsOf = formatTimestamp(new Date());
              }
              
              if ((security as any).iso_currency_code) {
                updateData.currencyCode = (security as any).iso_currency_code;
              }
              
              if (Object.keys(updateData).length > 1) { // More than just updatedAt
                await supabase
                  .from('Security')
                  .update(updateData)
                  .eq('id', securityId);
              }
            } else {
              // Create new Security
              securityId = crypto.randomUUID();
              const { error: securityError } = await supabase.from('Security').insert({
                id: securityId,
                symbol: security.ticker_symbol || security.name || 'UNKNOWN',
                name: security.name || security.ticker_symbol || 'Unknown Security',
                class: security.type || 'other',
                sector: null, // Plaid doesn't provide sector
                closePrice: (security as any).close_price || null,
                closePriceAsOf: (security as any).close_price ? formatTimestamp(new Date()) : null,
                currencyCode: (security as any).iso_currency_code || null,
                createdAt: formatTimestamp(new Date()),
                updatedAt: formatTimestamp(new Date()),
              });

              if (securityError) {
                console.error('Error creating security:', securityError);
                errors++;
                continue;
              }
            }

            // Sum the holding value to total account value
            const holdingValue = holding.institution_value || 0;
            totalAccountValue += holdingValue;

            holdingsSynced++;
          } catch (error) {
            console.error('Error processing holding:', error);
            errors++;
          }
        }

        // Fallback: If holdings sum is 0 or very low, use account balance from Plaid
        // This ensures we have a balance even if holdings aren't properly synced
        if (totalAccountValue === 0 || totalAccountValue < 0.01) {
          const plaidBalance = plaidAccount.balances?.current ?? plaidAccount.balances?.available ?? null;
          if (plaidBalance !== null && plaidBalance > 0) {
            console.log(`[PLAID INVESTMENTS] Using Plaid account balance as fallback for account ${plaidAccount.account_id}: ${plaidBalance}`);
            totalAccountValue = plaidBalance;
          }
        }

        // Store or update total account value in AccountInvestmentValue
        // This is the sum of all holdings for this account (or Plaid balance as fallback)
        const { data: existingValue } = await supabase
          .from('AccountInvestmentValue')
          .select('id')
          .eq('accountId', accountId)
          .single();

        if (existingValue) {
          await supabase
            .from('AccountInvestmentValue')
            .update({
              totalValue: totalAccountValue,
              updatedAt: formatTimestamp(new Date()),
            })
            .eq('id', existingValue.id);
        } else {
          await supabase.from('AccountInvestmentValue').insert({
            id: crypto.randomUUID(),
            accountId: accountId,
            totalValue: totalAccountValue,
            createdAt: formatTimestamp(new Date()),
            updatedAt: formatTimestamp(new Date()),
          });
        }

        // Process investment transactions for this account
        const accountTransactions = investmentTransactions.filter(
          (tx) => tx.account_id === plaidAccount.account_id
        );

        // Get already synced transaction IDs - use plaidInvestmentTransactionId if available for better deduplication
        const { data: syncedTransactions } = await supabase
          .from('InvestmentTransaction')
          .select('id, plaidInvestmentTransactionId, date, type, quantity, price, securityId')
          .eq('accountId', accountId);

        // Create map using plaidInvestmentTransactionId (preferred) or fallback to composite key
        const syncedTxMap = new Map<string, string>();
        syncedTransactions?.forEach((t) => {
          if (t.plaidInvestmentTransactionId) {
            syncedTxMap.set(t.plaidInvestmentTransactionId, t.id);
          } else {
            // Fallback to composite key for old transactions without plaidInvestmentTransactionId
            const txKey = `${t.date}-${t.type}-${t.quantity}-${t.price}-${t.securityId}`;
            syncedTxMap.set(txKey, t.id);
          }
        });

        for (const plaidTx of accountTransactions) {
          try {
            // Check if transaction already exists - prefer plaidInvestmentTransactionId
            const plaidTxId = plaidTx.investment_transaction_id;
            if (plaidTxId && syncedTxMap.has(plaidTxId)) {
              continue; // Skip already synced transactions
            }
            
            // Fallback to composite key if plaidInvestmentTransactionId is not available
            const txKey = `${plaidTx.date}-${plaidTx.type}-${plaidTx.quantity || 0}-${plaidTx.price || 0}-${plaidTx.security_id || ''}`;
            if (!plaidTxId && syncedTxMap.has(txKey)) {
              continue; // Skip already synced transactions
            }

            // Find or create Security
            const security = securities.find((s) => s.security_id === plaidTx.security_id);
            if (!security) {
              console.warn(`Security not found for transaction: ${plaidTx.security_id}`);
              continue;
            }

            let securityId: string;
            const { data: existingSecurity } = await supabase
              .from('Security')
              .select('id')
              .eq('symbol', security.ticker_symbol || security.name)
              .single();

            if (existingSecurity) {
              securityId = existingSecurity.id;
              
              // Update security with latest price and currency if available
              const updateData: any = {
                updatedAt: formatTimestamp(new Date()),
              };
              
              if ((security as any).close_price !== undefined && (security as any).close_price !== null) {
                updateData.closePrice = (security as any).close_price;
                updateData.closePriceAsOf = formatTimestamp(new Date());
              }
              
              if ((security as any).iso_currency_code) {
                updateData.currencyCode = (security as any).iso_currency_code;
              }
              
              if (Object.keys(updateData).length > 1) { // More than just updatedAt
                await supabase
                  .from('Security')
                  .update(updateData)
                  .eq('id', securityId);
              }
            } else {
              // Create new Security
              securityId = crypto.randomUUID();
              await supabase.from('Security').insert({
                id: securityId,
                symbol: security.ticker_symbol || security.name || 'UNKNOWN',
                name: security.name || security.ticker_symbol || 'Unknown Security',
                class: security.type || 'other',
                sector: null,
                closePrice: (security as any).close_price || null,
                closePriceAsOf: (security as any).close_price ? formatTimestamp(new Date()) : null,
                currencyCode: (security as any).iso_currency_code || null,
                createdAt: formatTimestamp(new Date()),
                updatedAt: formatTimestamp(new Date()),
              });
            }

            // Map Plaid transaction type to our transaction type
            let transactionType = 'buy';
            if (plaidTx.type === InvestmentTransactionType.Sell) {
              transactionType = 'sell';
            } else if (plaidTx.type === InvestmentTransactionType.Transfer) {
              transactionType = 'transfer';
            } else if (plaidTx.type === InvestmentTransactionType.Cash) {
              // Cash transactions might include dividends
              // Check the transaction name to determine if it's a dividend
              const txName = (plaidTx.name || '').toLowerCase();
              if (txName.includes('dividend')) {
                transactionType = 'dividend';
              } else {
                transactionType = 'buy'; // Default cash transaction to buy
              }
            } else if (plaidTx.type === InvestmentTransactionType.Fee) {
              transactionType = 'buy'; // Fees are treated as buy transactions
            } else {
              // Check transaction name or subtype for dividend/interest
              // Plaid InvestmentTransactionType enum only has: Buy, Sell, Cancel, Cash, Fee, Transfer
              // Dividends and interest may come as Cash transactions or have specific names
              const txName = (plaidTx.name || '').toLowerCase();
              const txSubtype = ((plaidTx as any).subtype || '').toLowerCase();
              
              if (txName.includes('interest') || txSubtype.includes('interest')) {
                transactionType = 'interest';
              } else if (txName.includes('dividend') || txSubtype.includes('dividend')) {
                transactionType = 'dividend';
              }
              // If none match, transactionType remains 'buy' (default)
            }

            // Get currency code from transaction or security
            const currencyCode = (plaidTx as any).iso_currency_code || null;

            // Create investment transaction
            const transactionId = crypto.randomUUID();
            const txDate = new Date(plaidTx.date + 'T00:00:00');

            const { error: txError } = await supabase.from('InvestmentTransaction').insert({
              id: transactionId,
              accountId: accountId,
              securityId: securityId,
              date: formatTimestamp(txDate),
              type: transactionType,
              quantity: plaidTx.quantity || null,
              price: plaidTx.price || null,
              fees: plaidTx.fees || 0,
              notes: plaidTx.name || null,
              plaidInvestmentTransactionId: plaidTx.investment_transaction_id || null,
              plaidSubtype: (plaidTx as any).subtype || null,
              currencyCode: currencyCode,
              createdAt: formatTimestamp(new Date()),
              updatedAt: formatTimestamp(new Date()),
            });

            if (txError) {
              console.error('Error creating investment transaction:', txError);
              errors++;
            } else {
              transactionsSynced++;
            }
          } catch (error) {
            console.error('Error processing investment transaction:', error);
            errors++;
          }
        }
      } catch (error) {
        console.error(`Error processing investment account ${plaidAccount.account_id}:`, error);
        errors++;
      }
    }

    return { accountsSynced, holdingsSynced, transactionsSynced, errors };
  } catch (error: any) {
    console.error('Error syncing investment accounts:', error);
    throw new Error(error.message || 'Failed to sync investment accounts');
  }
}

