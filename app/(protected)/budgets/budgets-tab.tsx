"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet } from "lucide-react";
import { format } from "date-fns";
import { BudgetForm } from "@/components/forms/budget-form";
import { BudgetCard } from "@/components/budgets/budget-card";
import { useToast } from "@/components/toast-provider";

interface Budget {
  id: string;
  amount: number;
  note?: string | null;
  period: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  macroId?: string | null;
  category: {
    id: string;
    name: string;
  } | null;
  subcategory?: {
    id: string;
    name: string;
  } | null;
  actualSpend?: number;
  percentage?: number;
  status?: "ok" | "warning" | "over";
  displayName?: string;
  macro?: {
    id: string;
    name: string;
  } | null;
  budgetCategories?: Array<{
    category: {
      id: string;
      name: string;
    };
  }>;
}

interface Macro {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  macroId: string;
  macro?: {
    id: string;
    name: string;
  };
}

export function BudgetsTab() {
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const now = new Date();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [
        { getBudgetsClient },
        { getAllCategoriesClient },
        { getMacrosClient },
      ] = await Promise.all([
        import("@/lib/api/budgets-client"),
        import("@/lib/api/categories-client"),
        import("@/lib/api/categories-client"),
      ]);
      const [budgetsData, categoriesData, macrosData] = await Promise.all([
        getBudgetsClient(now),
        getAllCategoriesClient(),
        getMacrosClient(),
      ]);
      setBudgets(budgetsData as Budget[]);
      setCategories(categoriesData as Category[]);
      setMacros(macrosData as Macro[]);
      setHasLoaded(true);
    } catch (error) {
      console.error("Error loading data:", error);
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this budget?")) return;

    const budgetToDelete = budgets.find(b => b.id === id);
    
    // Optimistic update: remove from UI immediately
    setBudgets(prev => prev.filter(b => b.id !== id));
    setDeletingId(id);

    try {
      const { deleteBudgetClient } = await import("@/lib/api/budgets-client");
      await deleteBudgetClient(id);

      toast({
        title: "Budget deleted",
        description: "Your budget has been deleted successfully.",
        variant: "success",
      });
      
      // Não precisa recarregar - a atualização otimista já removeu da lista
    } catch (error) {
      console.error("Error deleting budget:", error);
      // Revert optimistic update on error
      if (budgetToDelete) {
        setBudgets(prev => [...prev, budgetToDelete]);
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete budget",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Budgets</h2>
          <p className="text-sm text-muted-foreground">
            Track your spending against budgets for {format(now, "MMMM yyyy")}
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedBudget(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Budget
        </Button>
      </div>

      {loading && !hasLoaded ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading budgets...
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first budget to start tracking your spending.
            </p>
            <Button
              onClick={() => {
                setSelectedBudget(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={(b) => {
                setSelectedBudget(b);
                setIsFormOpen(true);
              }}
              onDelete={(id) => {
                if (deletingId !== id) {
                  handleDelete(id);
                }
              }}
              deletingId={deletingId}
            />
          ))}
        </div>
      )}

      <BudgetForm 
        macros={macros}
        categories={categories} 
        period={now}
        budget={selectedBudget || undefined}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setSelectedBudget(null);
          }
        }}
        onSuccess={async () => {
          setSelectedBudget(null);
          // Small delay to ensure database is updated
          await new Promise(resolve => setTimeout(resolve, 100));
          loadData();
        }}
      />
    </div>
  );
}

