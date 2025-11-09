import type { Transaction } from "@/lib/api/transactions-client";

export function exportTransactionsToCSV(transactions: Transaction[]): string {
  const headers = ["Date", "Type", "Amount", "Account", "Category", "Subcategory", "Description"];
  
  const rows = transactions.map((tx) => {
    return [
      tx.date,
      tx.type,
      tx.amount,
      tx.account?.name || "",
      tx.category?.name || "",
      tx.subcategory?.name || "",
      tx.description || "",
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return csvContent;
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

