/**
 * Plaid utility functions
 * Shared utilities for Plaid integration
 */

import { PlaidTransactionMetadata } from "@/src/domain/plaid/plaid.types";

/**
 * Convert Plaid transaction object from snake_case to camelCase
 * This ensures consistency with project naming conventions
 */
export function convertPlaidTransactionToCamelCase(plaidTx: any): any {
  if (!plaidTx || typeof plaidTx !== 'object') {
    return plaidTx;
  }

  const converted: any = {};

  // Direct mappings (snake_case -> camelCase)
  const fieldMappings: Record<string, string> = {
    category_id: 'categoryId',
    transaction_type: 'transactionType',
    transaction_code: 'transactionCode',
    authorized_date: 'authorizedDate',
    authorized_datetime: 'authorizedDatetime',
    iso_currency_code: 'isoCurrencyCode',
    unofficial_currency_code: 'unofficialCurrencyCode',
    merchant_name: 'merchantName',
    merchant_entity_id: 'merchantEntityId',
    logo_url: 'logoUrl',
    personal_finance_category: 'personalFinanceCategory',
    personal_finance_category_icon_url: 'personalFinanceCategoryIconUrl',
    payment_channel: 'paymentChannel',
    payment_meta: 'paymentMeta',
    account_owner: 'accountOwner',
    pending_transaction_id: 'pendingTransactionId',
    check_number: 'checkNumber',
  };

  // Convert nested objects
  const nestedObjects: Record<string, (value: any) => any> = {
    location: (loc: any) => {
      if (!loc || typeof loc !== 'object') return loc;
      return {
        address: loc.address || null,
        city: loc.city || null,
        region: loc.region || null,
        postalCode: loc.postal_code || loc.postalCode || null,
        country: loc.country || null,
        lat: loc.lat || null,
        lon: loc.lon || null,
        storeNumber: loc.store_number || loc.storeNumber || null,
      };
    },
    personal_finance_category: (pfc: any) => {
      if (!pfc || typeof pfc !== 'object') return pfc;
      return {
        primary: pfc.primary || null,
        detailed: pfc.detailed || null,
        confidenceLevel: pfc.confidence_level || pfc.confidenceLevel || null,
      };
    },
    payment_meta: (pm: any) => {
      if (!pm || typeof pm !== 'object') return pm;
      return {
        byOrderOf: pm.by_order_of || pm.byOrderOf || null,
        payee: pm.payee || null,
        payer: pm.payer || null,
        paymentMethod: pm.payment_method || pm.paymentMethod || null,
        paymentProcessor: pm.payment_processor || pm.paymentProcessor || null,
        ppdId: pm.ppd_id || pm.ppdId || null,
        reason: pm.reason || null,
        referenceNumber: pm.reference_number || pm.referenceNumber || null,
      };
    },
    counterparties: (cp: any[]) => {
      if (!Array.isArray(cp)) return cp;
      return cp.map((c: any) => ({
        name: c.name || null,
        type: c.type || null,
        logoUrl: c.logo_url || c.logoUrl || null,
        website: c.website || null,
        entityId: c.entity_id || c.entityId || null,
        confidenceLevel: c.confidence_level || c.confidenceLevel || null,
      }));
    },
  };

  // Process all fields
  for (const [key, value] of Object.entries(plaidTx)) {
    // Skip null/undefined values
    if (value === null || value === undefined) {
      continue;
    }

    // Handle nested objects that need conversion
    if (nestedObjects[key]) {
      converted[fieldMappings[key] || key] = nestedObjects[key](value);
      continue;
    }

    // Handle direct field mappings
    if (fieldMappings[key]) {
      converted[fieldMappings[key]] = value;
    } else {
      // Keep other fields as-is (already camelCase or don't need conversion)
      converted[key] = value;
    }
  }

  return converted;
}

/**
 * Build Plaid metadata object from Plaid transaction
 */
export function buildPlaidMetadata(plaidTx: any): PlaidTransactionMetadata {
  const convertedTx = convertPlaidTransactionToCamelCase(plaidTx);
  
  return {
    // Categories
    category: convertedTx.category || plaidTx.category || null,
    categoryId: convertedTx.categoryId || plaidTx.category_id || null,
    
    // Transaction type and codes
    transactionType: convertedTx.transactionType || plaidTx.transaction_type || null,
    transactionCode: convertedTx.transactionCode || plaidTx.transaction_code || null,
    
    // Status and dates
    pending: convertedTx.pending !== undefined ? convertedTx.pending : (plaidTx.pending || false),
    authorizedDate: convertedTx.authorizedDate || plaidTx.authorized_date || null,
    authorizedDatetime: convertedTx.authorizedDatetime || plaidTx.authorized_datetime || null,
    datetime: convertedTx.datetime || plaidTx.datetime || null,
    
    // Currency
    isoCurrencyCode: convertedTx.isoCurrencyCode || plaidTx.iso_currency_code || null,
    unofficialCurrencyCode: convertedTx.unofficialCurrencyCode || plaidTx.unofficial_currency_code || null,
    
    // Merchant information
    merchantName: convertedTx.merchantName || plaidTx.merchant_name || null,
    merchantEntityId: convertedTx.merchantEntityId || plaidTx.merchant_entity_id || null,
    logoUrl: convertedTx.logoUrl || plaidTx.logo_url || null,
    website: convertedTx.website || plaidTx.website || null,
    
    // Personal finance category
    personalFinanceCategory: convertedTx.personalFinanceCategory || plaidTx.personal_finance_category || null,
    personalFinanceCategoryIconUrl: convertedTx.personalFinanceCategoryIconUrl || plaidTx.personal_finance_category_icon_url || null,
    
    // Location
    location: convertedTx.location || plaidTx.location || null,
    
    // Counterparties
    counterparties: convertedTx.counterparties || plaidTx.counterparties || null,
    
    // Payment information
    paymentChannel: convertedTx.paymentChannel || plaidTx.payment_channel || null,
    paymentMeta: convertedTx.paymentMeta || plaidTx.payment_meta || null,
    
    // Account and transaction relationships
    accountOwner: convertedTx.accountOwner || plaidTx.account_owner || null,
    pendingTransactionId: convertedTx.pendingTransactionId || plaidTx.pending_transaction_id || null,
    checkNumber: convertedTx.checkNumber || plaidTx.check_number || null,
  };
}

/**
 * Get a field from plaidMetadata with backward compatibility
 * Supports both camelCase (new) and snake_case (old) formats
 */
export function getPlaidMetadataField(
  plaidMetadata: any,
  camelCaseField: string,
  snakeCaseField?: string
): any {
  if (!plaidMetadata) return null;
  
  // Try camelCase first (new format)
  if (plaidMetadata[camelCaseField] !== undefined && plaidMetadata[camelCaseField] !== null) {
    return plaidMetadata[camelCaseField];
  }
  
  // Fallback to snake_case (old format) for backward compatibility
  const fallbackField = snakeCaseField || camelCaseToSnakeCase(camelCaseField);
  if (plaidMetadata[fallbackField] !== undefined && plaidMetadata[fallbackField] !== null) {
    return plaidMetadata[fallbackField];
  }
  
  return null;
}

/**
 * Convert camelCase to snake_case
 */
function camelCaseToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

