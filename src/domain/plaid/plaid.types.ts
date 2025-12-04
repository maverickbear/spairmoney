/**
 * Domain types for Plaid integration
 * Pure TypeScript types with no external dependencies
 */

/**
 * Plaid transaction metadata stored in plaidMetadata JSONB field
 * All fields use camelCase to match project conventions
 * 
 * Note: For backward compatibility, code should support both camelCase and snake_case
 * when reading existing data, but new data should always be saved in camelCase
 */
export interface PlaidTransactionMetadata {
  // Categories
  category?: string[] | null;
  categoryId?: string | null;
  
  // Transaction type and codes
  transactionType?: string | null; // "place", "digital", "special", "unresolved"
  transactionCode?: string | null; // European institutions only
  
  // Status and dates
  pending?: boolean | null;
  authorizedDate?: string | null;
  authorizedDatetime?: string | null;
  datetime?: string | null;
  
  // Currency
  isoCurrencyCode?: string | null;
  unofficialCurrencyCode?: string | null;
  
  // Merchant information
  merchantName?: string | null;
  merchantEntityId?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  
  // Personal finance category (Plaid's AI categorization)
  personalFinanceCategory?: {
    primary?: string | null;
    detailed?: string | null;
    confidenceLevel?: string | null;
  } | null;
  personalFinanceCategoryIconUrl?: string | null;
  
  // Location
  location?: {
    address?: string | null;
    city?: string | null;
    region?: string | null;
    postalCode?: string | null;
    country?: string | null;
    lat?: number | null;
    lon?: number | null;
    storeNumber?: string | null;
  } | null;
  
  // Counterparties (merchants, marketplaces, etc.)
  counterparties?: Array<{
    name?: string | null;
    type?: string | null;
    logoUrl?: string | null;
    website?: string | null;
    entityId?: string | null;
    confidenceLevel?: string | null;
  }> | null;
  
  // Payment information
  paymentChannel?: string | null; // "in store", "online", "other"
  paymentMeta?: {
    byOrderOf?: string | null;
    payee?: string | null;
    payer?: string | null;
    paymentMethod?: string | null;
    paymentProcessor?: string | null;
    ppdId?: string | null;
    reason?: string | null;
    referenceNumber?: string | null;
  } | null;
  
  // Account and transaction relationships
  accountOwner?: string | null;
  pendingTransactionId?: string | null;
  checkNumber?: string | null;
  
  // Backward compatibility: support old snake_case fields when reading
  // These should not be used when writing new data
  category_id?: string | null; // @deprecated - use categoryId
  authorized_date?: string | null; // @deprecated - use authorizedDate
  authorized_datetime?: string | null; // @deprecated - use authorizedDatetime
  iso_currency_code?: string | null; // @deprecated - use isoCurrencyCode
  unofficial_currency_code?: string | null; // @deprecated - use unofficialCurrencyCode
  transaction_code?: string | null; // @deprecated - use transactionCode
  account_owner?: string | null; // @deprecated - use accountOwner
  pending_transaction_id?: string | null; // @deprecated - use pendingTransactionId
}

/**
 * Plaid liability information
 */
export interface PlaidLiability {
  id: string;
  accountId: string;
  liabilityType: 'credit_card' | 'student_loan' | 'mortgage' | 'auto_loan' | 'personal_loan' | 'business_loan' | 'other';
  apr?: number | null;
  interestRate?: number | null;
  minimumPayment?: number | null;
  lastPaymentAmount?: number | null;
  lastPaymentDate?: string | null;
  nextPaymentDueDate?: string | null;
  lastStatementBalance?: number | null;
  lastStatementDate?: string | null;
  creditLimit?: number | null;
  currentBalance?: number | null;
  availableCredit?: number | null;
  plaidAccountId?: string | null;
  plaidItemId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Plaid connection information
 */
export interface PlaidConnection {
  id: string;
  userId: string;
  itemId: string;
  accessToken: string;
  institutionId?: string | null;
  institutionName?: string | null;
  transactionsCursor?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Plaid institution information
 */
export interface PlaidInstitution {
  institution_id: string;
  name: string;
  products: string[];
  country_codes: string[];
  url?: string;
  primary_color?: string;
  logo?: string;
  routing_numbers?: string[];
  oauth?: boolean;
}

/**
 * Sync result for transactions
 */
export interface PlaidSyncResult {
  synced: number;
  skipped: number;
  errors: number;
  totalProcessed?: number;
}

