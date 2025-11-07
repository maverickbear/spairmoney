"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Wallet } from "lucide-react";
import { format } from "date-fns";
import { BudgetForm } from "@/components/forms/budget-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/toast-provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/components/common/money";
import { cn } from "@/lib/utils";

interface Budget {
  id: string;
  amount: number;
  note?: string | null;
  period: string;
  categoryId?: string | null;
  macroId?: string | null;
  category: {
    id: string;
    name: string;
  };
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

export default function BudgetsPage() {
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
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
    }
  }


  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Budgets</h1>
          <p className="text-sm md:text-base text-muted-foreground">
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

      {loading && budgets.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Spent / Budget</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Spent / Budget</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => {
                  const getStatusColor = () => {
                    if (budget.status === "over") return "bg-destructive";
                    if (budget.status === "warning") return "bg-yellow-500 dark:bg-yellow-600";
                    return "bg-green-500 dark:bg-green-600";
                  };

                  const clampedPercentage = Math.min(budget.percentage || 0, 100);

                  return (
                    <TableRow key={budget.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {budget.displayName || budget.category.name}
                          </div>
                          {budget.budgetCategories && budget.budgetCategories.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {budget.budgetCategories.map(bc => bc.category.name).join(", ")}
                            </p>
                          )}
                          {budget.note && (
                            <p className="text-xs text-muted-foreground mt-1">{budget.note}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatMoney(budget.actualSpend || 0)} / {formatMoney(budget.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            budget.status === "over" && "text-destructive",
                            budget.status === "warning" && "text-yellow-600 dark:text-yellow-400",
                            budget.status === "ok" && "text-green-600 dark:text-green-400"
                          )}
                        >
                          {(budget.percentage || 0).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="w-full max-w-[200px]">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full transition-all",
                                getStatusColor()
                              )}
                              style={{ width: `${clampedPercentage}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedBudget(budget);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(budget.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
