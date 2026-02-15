"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CategorySelectionModal } from "./category-selection-modal";
import type { Transaction } from "@/src/domain/transactions/transactions.types";
import type { Category } from "@/src/domain/categories/categories.types";

interface CategorySelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  categories: Category[];
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  onCategorySelect: (categoryId: string | null, subcategoryId: string | null) => void;
  onClear: () => void;
  onSave: () => void;
  saving?: boolean;
  clearTrigger: number;
}

export function CategorySelectionDialog({
  open,
  onOpenChange,
  transaction,
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  onCategorySelect,
  onClear,
  onSave,
  saving = false,
  clearTrigger,
}: CategorySelectionDialogProps) {
  const handleClear = () => {
    onClear();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transaction?.category?.name ? "Change Category" : "Add Category"}
          </DialogTitle>
          <DialogDescription>
            Select a category for this transaction
          </DialogDescription>
        </DialogHeader>
        <CategorySelectionModal
          transaction={transaction}
          categories={categories}
          onSelect={onCategorySelect}
          onClear={onClear}
          clearTrigger={clearTrigger}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClear} disabled={saving}>
            Clear
          </Button>
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
                Saving
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

