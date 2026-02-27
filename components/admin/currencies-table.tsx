"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import type { CurrencyRow } from "@/src/infrastructure/database/repositories/currency.repository";

interface CurrenciesTableProps {
  currencies: CurrencyRow[];
  loading?: boolean;
  onToggleActive: (code: string, isActive: boolean) => void;
}

export function CurrenciesTable({
  currencies,
  loading = false,
  onToggleActive,
}: CurrenciesTableProps) {
  if (loading) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center text-muted-foreground">Loading currencies...</div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Locale</TableHead>
            <TableHead>Sort</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currencies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No currencies. Run the seed script to populate.
              </TableCell>
            </TableRow>
          ) : (
            currencies.map((row) => (
              <TableRow key={row.code}>
                <TableCell className="font-mono font-medium">{row.code}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell className="font-mono text-muted-foreground">{row.locale}</TableCell>
                <TableCell>{row.sortOrder}</TableCell>
                <TableCell>
                  <Switch
                    checked={row.isActive}
                    onCheckedChange={(checked) => onToggleActive(row.code, checked)}
                    aria-label={`${row.isActive ? "Deactivate" : "Activate"} ${row.code}`}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
