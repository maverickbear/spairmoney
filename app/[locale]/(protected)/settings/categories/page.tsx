"use client";

import { usePagePerformance } from "@/hooks/use-page-performance";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CategoriesModule } from "@/src/presentation/components/features/categories/categories-module";
import { MobileAddBar } from "@/components/common/mobile-add-bar";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useWriteGuard } from "@/hooks/use-write-guard";

export default function CategoriesPage() {
  const t = useTranslations("nav");
  const perf = usePagePerformance("Settings - Categories");
  const { checkWriteAccess } = useWriteGuard();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      perf.markComplete();
    }, 100);
    return () => clearTimeout(timer);
  }, [perf]);

  return (
    <div>
      <PageHeader title={t("items.categories")} />

      <div className="w-full p-4 lg:p-8 pb-32 lg:pb-8">
        {/* Action Buttons - desktop only */}
        <div className="hidden lg:flex items-center gap-2 justify-end mb-6">
          <Button
            onClick={() => {
              if (!checkWriteAccess()) return;
              setIsCreateDialogOpen(true);
            }}
            size="medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>
        <CategoriesModule 
          isCreateDialogOpen={isCreateDialogOpen}
          onCreateDialogChange={setIsCreateDialogOpen}
        />

      {/* Mobile Add bar - fixed above bottom nav */}
      <MobileAddBar>
        <Button
          size="mobileAdd"
          onClick={() => {
            if (!checkWriteAccess()) return;
            setIsCreateDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Category
        </Button>
      </MobileAddBar>
      </div>
    </div>
  );
}

