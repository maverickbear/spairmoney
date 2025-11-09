/**
 * TypeScript types for Plaid API responses and metadata
 */

/**
 * Plaid transaction metadata stored in plaidMetadata JSONB field
 */
export interface PlaidTransactionMetadata {
  // Categories
  category?: string[] | null;
  category_id?: string | null;
  
  // Status and dates
  pending?: boolean | null;
  authorized_date?: string | null;
  authorized_datetime?: string | null;
  datetime?: string | null;
  
  // Currency
  iso_currency_code?: string | null;
  unofficial_currency_code?: string | null;
  
  // Transaction codes
  transaction_code?: string | null;
  account_owner?: string | null;
  
  // Pending transaction relationship
  pending_transaction_id?: string | null;
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
 * Plaid credit card liability details
 */
export interface PlaidCreditCardLiability {
  account_id: string;
  aprs?: Array<{
    apr_percentage?: number | null;
    apr_type?: string | null;
    balance_subject_to_apr?: number | null;
    interest_charge_amount?: number | null;
  }> | null;
  is_overdue?: boolean | null;
  last_payment_amount?: number | null;
  last_payment_date?: string | null;
  last_statement_balance?: number | null;
  last_statement_date?: string | null;
  minimum_payment_amount?: number | null;
  next_payment_due_date?: string | null;
}

/**
 * Plaid student loan liability details
 */
export interface PlaidStudentLoanLiability {
  account_id: string;
  account_number?: string | null;
  disbursement_dates?: string[] | null;
  expected_payoff_date?: string | null;
  guarantor?: string | null;
  interest_rate_percentage?: number | null;
  is_overdue?: boolean | null;
  last_payment_amount?: number | null;
  last_payment_date?: string | null;
  loan_status?: {
    end_date?: string | null;
    type?: string | null;
  } | null;
  loan_name?: string | null;
  minimum_payment_amount?: number | null;
  next_payment_due_date?: string | null;
  origination_date?: string | null;
  origination_principal_amount?: number | null;
  outstanding_interest_amount?: number | null;
  payment_reference_number?: string | null;
  pslf_status?: {
    estimated_eligibility_date?: string | null;
    payments_made?: number | null;
    payments_remaining?: number | null;
  } | null;
  repayment_plan?: {
    description?: string | null;
    type?: string | null;
  } | null;
  sequence_number?: string | null;
  servicer_address?: {
    city?: string | null;
    country?: string | null;
    postal_code?: string | null;
    region?: string | null;
    street?: string | null;
  } | null;
  ytd_interest_paid?: number | null;
  ytd_principal_paid?: number | null;
}

/**
 * Plaid mortgage liability details
 */
export interface PlaidMortgageLiability {
  account_id: string;
  account_number?: string | null;
  current_late_fee?: number | null;
  escrow_balance?: number | null;
  has_pmi?: boolean | null;
  has_prepayment_penalty?: boolean | null;
  interest_rate?: {
    percentage?: number | null;
    type?: string | null;
  } | null;
  last_payment_amount?: number | null;
  last_payment_date?: string | null;
  loan_type_description?: string | null;
  loan_term?: string | null;
  maturity_date?: string | null;
  next_monthly_payment?: number | null;
  next_payment_due_date?: string | null;
  origination_date?: string | null;
  origination_principal_amount?: number | null;
  past_due_amount?: number | null;
  property_address?: {
    city?: string | null;
    country?: string | null;
    postal_code?: string | null;
    region?: string | null;
    street?: string | null;
  } | null;
  ytd_interest_paid?: number | null;
  ytd_principal_paid?: number | null;
}

