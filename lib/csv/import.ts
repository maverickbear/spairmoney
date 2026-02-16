import Papa from "papaparse";

export interface CSVRow {
  [key: string]: string | undefined;
}

export interface ColumnMapping {
  date?: string;
  amount?: string;
  description?: string;
  account?: string;
  toAccount?: string; // For transfer transactions
  category?: string;
  subcategory?: string;
  type?: string;
  recurring?: string; // "true"/"false" or "yes"/"no"
  expenseType?: string; // "fixed" | "variable"
  /** Optional: column with YYYY-MM for "count in month" (competency month) */
  competencyMonth?: string;
}

export interface AccountMapping {
  [csvAccountName: string]: string; // Maps CSV account name to account ID
}

export interface TransactionTypeMapping {
  [csvTypeValue: string]: "expense" | "income" | "transfer"; // Maps CSV type value to system type
}

export function parseCSV(file: File): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Clean up header names - remove BOM and trim whitespace
        return header.replace(/^\uFEFF/, '').trim();
      },
      complete: (results) => {
        console.log(`[parseCSV] Parsed ${results.data.length} rows from ${file.name}`);
        if (results.errors && results.errors.length > 0) {
          console.warn(`[parseCSV] Parse errors:`, results.errors);
        }
        if (results.data.length > 0) {
          console.log(`[parseCSV] First row:`, results.data[0]);
          console.log(`[parseCSV] Column names:`, Object.keys(results.data[0] as CSVRow));
        }
        resolve(results.data as CSVRow[]);
      },
      error: (error) => {
        console.error(`[parseCSV] Parse error for ${file.name}:`, error);
        reject(error);
      },
    });
  });
}

export async function parseCSVs(files: File[]): Promise<Map<number, CSVRow[]>> {
  const parsedFiles = new Map<number, CSVRow[]>();
  
  await Promise.all(
    files.map(async (file, index) => {
      try {
        const rows = await parseCSV(file);
        parsedFiles.set(index, rows);
      } catch (error) {
        console.error(`[parseCSVs] Error parsing file ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    })
  );
  
  return parsedFiles;
}

interface Account {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  subcategories?: Subcategory[];
}

interface TransactionInput {
  date: Date;
  type: string;
  amount: number;
  accountId?: string;
  toAccountId?: string; // For transfer transactions
  categoryId?: string;
  subcategoryId?: string;
  description?: string;
  recurring?: boolean;
  /** Optional YYYY-MM: month this transaction counts toward (e.g. salary on Dec 30 → "2025-01") */
  competencyMonth?: string;
}

export interface MapResult {
  transaction?: TransactionInput;
  error?: string;
  rowIndex: number;
}

/**
 * Extract unique account names from CSV rows
 */
export function extractUniqueAccountNames(
  rows: CSVRow[],
  accountColumn: string
): string[] {
  const accountNames = new Set<string>();
  rows.forEach((row) => {
    const accountName = row[accountColumn]?.trim();
    if (accountName) {
      accountNames.add(accountName);
    }
  });
  return Array.from(accountNames).sort();
}

/**
 * Extract unique transaction type values from CSV rows
 */
export function extractUniqueTransactionTypes(
  rows: CSVRow[],
  typeColumn: string
): string[] {
  const typeValues = new Set<string>();
  rows.forEach((row) => {
    const typeValue = row[typeColumn]?.trim();
    if (typeValue) {
      typeValues.add(typeValue);
    }
  });
  return Array.from(typeValues).sort();
}

export function mapCSVToTransactions(
  rows: CSVRow[],
  mapping: ColumnMapping,
  accounts: Account[],
  categories: Category[],
  accountMapping?: AccountMapping,
  defaultAccountId?: string,
  transactionTypeMapping?: TransactionTypeMapping
): MapResult[] {
  return rows.map((row, index) => {
    try {
      const dateStr = mapping.date ? row[mapping.date] : undefined;
      let date: Date;
      
      if (dateStr) {
        // Try to parse the date - handle common formats
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) {
          return {
            rowIndex: index + 1,
            error: `Invalid date format: ${dateStr}`,
          };
        }
        date = parsedDate;
      } else {
        date = new Date();
      }
      
      const amountStr = mapping.amount ? row[mapping.amount] : "0";
      const cleanedAmount = amountStr?.replace(/[^0-9.-]/g, "") || "0";
      const amount = parseFloat(cleanedAmount);
      
      if (isNaN(amount) || amount === 0) {
        return {
          rowIndex: index + 1,
          error: `Invalid amount: ${amountStr}`,
        };
      }
      
      const description = mapping.description ? row[mapping.description] : "";
      const accountName = mapping.account ? row[mapping.account]?.trim() : "";
      const toAccountName = mapping.toAccount ? row[mapping.toAccount]?.trim() : "";
      const categoryName = mapping.category ? row[mapping.category] : "";
      const subcategoryName = mapping.subcategory ? row[mapping.subcategory] : "";
      
      // Normalize transaction type
      // If transactionTypeMapping exists, use it (individual mapping from CSV column)
      // Otherwise, if mapping.type is a direct value (expense/income/transfer), use it as default
      // Otherwise, default to expense
      let type: string;
      if (transactionTypeMapping && mapping.type && row[mapping.type]) {
        // Use individual type mapping from CSV column
        const csvTypeValue = row[mapping.type]?.trim();
        if (csvTypeValue && transactionTypeMapping[csvTypeValue]) {
          type = transactionTypeMapping[csvTypeValue];
        } else {
          // CSV value not mapped - default to expense
          type = "expense";
        }
      } else if (mapping.type && ["expense", "income", "transfer"].includes(mapping.type)) {
        // Direct default type specified (not a CSV column)
        type = mapping.type;
      } else {
        // Default to expense if no mapping
        type = "expense";
      }
      
      // Parse recurring (boolean)
      let recurring: boolean = false;
      if (mapping.recurring) {
        const recurringValue = row[mapping.recurring]?.toLowerCase().trim();
        if (recurringValue === "true" || recurringValue === "1" || recurringValue === "yes" || recurringValue === "y") {
          recurring = true;
        } else if (recurringValue === "false" || recurringValue === "0" || recurringValue === "no" || recurringValue === "n") {
          recurring = false;
        }
      }

      // Find account using mapping or direct match (case-insensitive)
      let account: Account | undefined;
      
      if (accountMapping && accountName && accountMapping[accountName]) {
        // Use explicit mapping
        account = accounts.find((a) => a.id === accountMapping[accountName]);
      } else if (accountName) {
        // Try exact match first
        account = accounts.find((a) => a.name === accountName);
        
        // If not found, try case-insensitive match
        if (!account) {
          account = accounts.find((a) => a.name.toLowerCase() === accountName.toLowerCase());
        }
      }
      
      // Find toAccount for transfers
      let toAccount: Account | undefined;
      if (type === "transfer" && toAccountName) {
        if (accountMapping && accountMapping[toAccountName]) {
          // Use explicit mapping
          toAccount = accounts.find((a) => a.id === accountMapping[toAccountName]);
        } else {
          // Try exact match first
          toAccount = accounts.find((a) => a.name === toAccountName);
          
          // If not found, try case-insensitive match
          if (!toAccount) {
            toAccount = accounts.find((a) => a.name.toLowerCase() === toAccountName.toLowerCase());
          }
        }
      }
      
      const category = categories.find((c) => c.name === categoryName);
      const subcategory = category?.subcategories?.find((s) => s.name === subcategoryName);

      // Use default account if no account found and defaultAccountId is provided
      if (!account?.id) {
        if (defaultAccountId && defaultAccountId !== "__none__") {
          account = accounts.find((a) => a.id === defaultAccountId);
        }
        
        if (!account?.id) {
          const availableAccounts = accounts.map(a => a.name).join(", ");
          const errorMsg = accountName 
            ? `Account not found: "${accountName}". Available accounts: ${availableAccounts || "None"}. Please map the account or set a default account.`
            : `No account specified. Please map an account column or set a default account. Available accounts: ${availableAccounts || "None"}`;
          return {
            rowIndex: index + 1,
            error: errorMsg,
          };
        }
      }

      // Final validation: ensure account.id exists
      if (!account || !account.id) {
        return {
          rowIndex: index + 1,
          error: `Invalid account. Please check your account mapping.`,
        };
      }

      // Validate transfer requirements (only if toAccount is provided)
      if (type === "transfer" && toAccountName) {
        if (!toAccount?.id) {
          return {
            rowIndex: index + 1,
            error: `Destination account not found: "${toAccountName}". Available accounts: ${accounts.map(a => a.name).join(", ")}`,
          };
        }
        if (account.id === toAccount.id) {
          return {
            rowIndex: index + 1,
            error: `Transfer requires different source and destination accounts. Both are: "${accountName}"`,
          };
        }
      }

      // Parse optional competency month (YYYY-MM)
      let competencyMonth: string | undefined;
      if (mapping.competencyMonth && row[mapping.competencyMonth]) {
        const val = String(row[mapping.competencyMonth] ?? "").trim();
        if (/^\d{4}-(0[1-9]|1[0-2])$/.test(val)) competencyMonth = val;
      }

      return {
        rowIndex: index + 1,
        transaction: {
          date,
          type: type as "expense" | "income" | "transfer",
          amount: Math.abs(amount), // Ensure positive amount
          accountId: account.id,
          toAccountId: type === "transfer" && toAccount?.id ? toAccount.id : undefined,
          categoryId: category?.id,
          subcategoryId: subcategory?.id,
          description: description || "",
          recurring: recurring,
          competencyMonth,
        },
      };
    } catch (error) {
      return {
        rowIndex: index + 1,
        error: error instanceof Error ? error.message : `Error processing row ${index + 1}`,
      };
    }
  });
}

const COMPETENCY_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Suggest competency month for income transactions at end of month (e.g. 28–31).
 * Sets competencyMonth to the following month (YYYY-MM) so salary deposited Dec 30 counts in January.
 * Returns a new array; does not mutate. Only suggests for rows that have a valid transaction and no competencyMonth yet.
 */
export function suggestCompetencyMonthForEndOfMonthIncome(
  results: MapResult[],
  lastDaysOfMonth = 5
): MapResult[] {
  return results.map((r) => {
    if (r.error || !r.transaction || r.transaction.type !== "income") return r;
    if (r.transaction.competencyMonth && COMPETENCY_MONTH_REGEX.test(r.transaction.competencyMonth))
      return r;
    const d = r.transaction.date instanceof Date ? r.transaction.date : new Date(r.transaction.date);
    const day = d.getDate();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const fromDay = Math.max(1, lastDay - lastDaysOfMonth + 1);
    if (day < fromDay || day > lastDay) return r;
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const y = next.getFullYear();
    const m = next.getMonth() + 1;
    const competencyMonth = `${y}-${String(m).padStart(2, "0")}`;
    return {
      ...r,
      transaction: { ...r.transaction, competencyMonth },
    };
  });
}

