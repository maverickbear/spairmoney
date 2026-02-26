"use client";

import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CategorySelectionModal } from "./category-selection-modal";
import { Loader2 } from "lucide-react";
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
  const t = useTranslations("common");
  const tForms = useTranslations("forms");
  const handleClear = () => {
    onClear();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-[600px] w-full p-0 flex flex-col gap-0 overflow-hidden bg-background border-l"
      >
        <SheetHeader className="p-6 pb-4 border-b shrink-0">
          <SheetTitle className="text-xl">
            {transaction?.category?.name ? tForms("changeCategory") : tForms("addCategory")}
          </SheetTitle>
          <SheetDescription>
            {tForms("selectCategoryForTransaction")}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              <CategorySelectionModal
                transaction={transaction}
                categories={categories}
                onSelect={onCategorySelect}
                onClear={onClear}
                clearTrigger={clearTrigger}
              />
            </div>
          </ScrollArea>
          <div className="p-4 border-t flex flex-wrap justify-end gap-2 shrink-0 bg-background">
            <Button type="button" variant="outline" size="medium" onClick={handleClear} disabled={saving}>
              {t("clear")}
            </Button>
            <Button type="button" size="medium" onClick={onSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
                  {t("saving")}
                </>
              ) : (
                t("save")
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

