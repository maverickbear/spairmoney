import Papa from "papaparse";

export interface CSVRow {
  [key: string]: string | undefined;
}

export interface ColumnMapping {
  date?: string;
  amount?: string;
  description?: string;
  account?: string;
  category?: string;
  subcategory?: string;
  type?: string;
  tags?: string;
}

export function parseCSV(file: File): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as CSVRow[]);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
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
  categoryId?: string;
  subcategoryId?: string;
  description?: string;
  tags: string[];
}

export function mapCSVToTransactions(
  rows: CSVRow[],
  mapping: ColumnMapping,
  accounts: Account[],
  categories: Category[]
): TransactionInput[] {
  return rows.map((row) => {
    const dateStr = mapping.date ? row[mapping.date] : undefined;
    const date = dateStr ? new Date(dateStr) : new Date();
    
    const amountStr = mapping.amount ? row[mapping.amount] : "0";
    const amount = parseFloat(amountStr?.replace(/[^0-9.-]/g, "") || "0");
    
    const description = mapping.description ? row[mapping.description] : "";
    const accountName = mapping.account ? row[mapping.account] : "";
    const categoryName = mapping.category ? row[mapping.category] : "";
    const subcategoryName = mapping.subcategory ? row[mapping.subcategory] : "";
    const type = (mapping.type ? row[mapping.type]?.toLowerCase() : "expense") || "expense";
    const tagsStr = mapping.tags ? row[mapping.tags] : "";
    const tags = tagsStr ? tagsStr.split(",").map((t) => t.trim()) : [];

    const account = accounts.find((a) => a.name === accountName);
    const category = categories.find((c) => c.name === categoryName);
    const subcategory = category?.subcategories?.find((s) => s.name === subcategoryName);

    if (!account?.id) {
      throw new Error(`Account not found: ${accountName}`);
    }

    return {
      date,
      type,
      amount,
      accountId: account.id,
      categoryId: category?.id,
      subcategoryId: subcategory?.id,
      description: description || "",
      tags,
    };
  });
}

