"use client";

import { useState, useEffect } from "react";
import { usePagePerformance } from "@/hooks/use-page-performance";
import { DebtCard } from "@/components/debts/debt-card";
import { DebtForm } from "@/components/forms/debt-form";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, CreditCard, Loader2, Edit, Trash2, Pause, Play, DollarSign } from "lucide-react";
import { RecordPaymentDialog } from "@/components/debts/record-payment-dialog";
import { useToast } from "@/components/toast-provider";
import { formatMoney } from "@/components/common/money";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { MobileAddBar } from "@/components/common/mobile-add-bar";
import { PageHeader } from "@/components/common/page-header";
import { useWriteGuard } from "@/hooks/use-write-guard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Debt {
  id: string;
  name: string;
  loanType: string;
  initialAmount: number;
  downPayment: number;
  currentBalance: number;
  interestRate: number;
  totalMonths: number | null;
  firstPaymentDate: string;
  startDate?: string | null;
  monthlyPayment: number;
  paymentFrequency?: string;
  paymentAmount?: number | null;
  principalPaid: number;
  interestPaid: number;
  additionalContributions: boolean;
  additionalContributionAmount?: number | null;
  priority: "High" | "Medium" | "Low";
  description?: string | null;
  accountId?: string | null;
  isPaidOff: boolean;
  isPaused: boolean;
  paidOffAt?: string | null;
  createdAt: string;
  updatedAt: string;
  status?: string;
  nextDueDate?: string | null;
  monthsRemaining?: number | null;
  totalInterestRemaining?: number;
  progressPct?: number;
}

export default function DebtsPage() {
  const perf = usePagePerformance("Debts");
  const { openDialog, ConfirmDialog } = useConfirmDialog();
  const { checkWriteAccess, canWrite } = useWriteGuard();
  const { toast } = useToast();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [sortBy, setSortBy] = useState<"priority" | "progress" | "months_remaining">("priority");
  const [filterBy, setFilterBy] = useState<"all" | "active" | "paused" | "paid_off">("all");
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pausingId, setPausingId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    loadDebts();
  }, []);

  async function loadDebts() {
    try {
      setLoading(true);
      const response = await fetch("/api/v2/debts");
      if (!response.ok) {
        throw new Error("Failed to fetch debts");
      }
      const data = await response.json();
      setDebts(data);
      setHasLoaded(true);
      perf.markDataLoaded();
    } catch (error) {
      console.error("Error loading debts:", error);
      setHasLoaded(true);
      perf.markDataLoaded();
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string) {
    openDialog(
      {
        title: "Delete Debt",
        description: "Are you sure you want to delete this debt?",
        variant: "destructive",
        confirmLabel: "Delete",
      },
      async () => {
        setDeletingId(id);
        try {
          const response = await fetch(`/api/v2/debts/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to delete debt");
          }

          loadDebts();
        } catch (error) {
          console.error("Error deleting debt:", error);
          alert(error instanceof Error ? error.message : "Failed to delete debt");
        } finally {
          setDeletingId(null);
        }
      }
    );
  }

  async function handlePause(id: string, isPaused: boolean) {
    setPausingId(id);
    try {
      const response = await fetch(`/api/v2/debts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPaused: !isPaused }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update debt");
      }

      loadDebts();
    } catch (error) {
      console.error("Error pausing/resuming debt:", error);
      alert(error instanceof Error ? error.message : "Failed to update debt");
    } finally {
      setPausingId(null);
    }
  }

  async function handlePayment(id: string) {
    setSelectedDebt(debts.find((d) => d.id === id) || null);
    setIsPaymentOpen(true);
  }


  // Filter and sort debts
  const filteredDebts = debts.filter((debt) => {
    if (filterBy === "active") return !debt.isPaidOff && !debt.isPaused;
    if (filterBy === "paused") return debt.isPaused;
    if (filterBy === "paid_off") return debt.isPaidOff;
    return true;
  });

  const sortedDebts = [...filteredDebts].sort((a, b) => {
    if (sortBy === "priority") {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    if (sortBy === "progress") {
      return (b.progressPct || 0) - (a.progressPct || 0);
    }
    if (sortBy === "months_remaining") {
      const aMonths = a.monthsRemaining ?? Infinity;
      const bMonths = b.monthsRemaining ?? Infinity;
      return aMonths - bMonths;
    }
    return 0;
  });


  const loanTypeLabels: Record<string, string> = {
    mortgage: "Mortgage",
    car_loan: "Car Loan",
    personal_loan: "Personal Loan",
    credit_card: "Credit Card",
    student_loan: "Student Loan",
    business_loan: "Business Loan",
    other: "Other",
  };

  return (
    <div>
      <PageHeader
        title="Debts"
      />

      <div className="w-full p-4 lg:p-8 pb-32 lg:pb-8">
        {/* Action Buttons - desktop only */}
        {canWrite && (
          <div className="hidden lg:flex items-center gap-2 justify-end mb-6">
            <Button
              size="medium"
              onClick={() => {
                if (!checkWriteAccess()) return;
                setSelectedDebt(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Debt
            </Button>
          </div>
        )}

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {loading && !hasLoaded ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-muted-foreground">Loading debts...</div>
              </CardContent>
            </Card>
          ) : sortedDebts.length === 0 ? (
            <div className="w-full h-full min-h-[400px]">
              <EmptyState
                icon={CreditCard}
                title={filterBy === "all" ? "No debts created yet" : `No ${filterBy} debts found`}
                description={
                  filterBy === "all"
                    ? "Create your first debt entry to start tracking your loans and debt payments."
                    : `Try adjusting your filters to see ${filterBy === "active" ? "completed" : "active"} debts.`
                }
              />
            </div>
          ) : (
            sortedDebts.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                onEdit={(d) => {
                  if (!checkWriteAccess()) return;
                  setSelectedDebt({ ...d, createdAt: debt.createdAt, updatedAt: debt.updatedAt });
                  setIsFormOpen(true);
                }}
                onDelete={(id) => {
                  if (!checkWriteAccess()) return;
                  if (deletingId !== id) {
                    handleDelete(id);
                  }
                }}
                onPause={(id, isPaused) => {
                  if (pausingId !== id) {
                    handlePause(id, isPaused);
                  }
                }}
                onPayment={handlePayment}
              />
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs md:text-sm">Name</TableHead>
                <TableHead className="text-xs md:text-sm">Loan Type</TableHead>
                <TableHead className="text-xs md:text-sm">Current Balance</TableHead>
                <TableHead className="text-xs md:text-sm">Monthly Payment</TableHead>
                <TableHead className="text-xs md:text-sm">Interest Rate</TableHead>
                <TableHead className="text-xs md:text-sm">Progress</TableHead>
                <TableHead className="text-xs md:text-sm">Months Remaining</TableHead>
                <TableHead className="text-xs md:text-sm">Status</TableHead>
                <TableHead className="text-xs md:text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !hasLoaded ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Loading debts...
                  </TableCell>
                </TableRow>
              ) : sortedDebts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {filterBy === "all" ? "No debts created yet" : `No ${filterBy} debts found`}
                  </TableCell>
                </TableRow>
              ) : (
                sortedDebts.map((debt) => {
                  const progressPct = debt.progressPct || 0;
                  const clampedProgress = Math.min(progressPct, 100);
                  const loanTypeLabel = loanTypeLabels[debt.loanType] || debt.loanType;

                  return (
                    <TableRow key={debt.id} className={debt.isPaidOff ? "opacity-75" : ""}>
                      <TableCell className="font-medium text-xs md:text-sm">
                        <div className="flex flex-col gap-0.5">
                          <span>{debt.name}</span>
                          {debt.priority && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs w-fit",
                                debt.priority === "High" && "border-sentiment-negative text-sentiment-negative",
                                debt.priority === "Medium" && "border-sentiment-warning text-sentiment-warning",
                                debt.priority === "Low" && "border-interactive-primary text-interactive-primary"
                              )}
                            >
                              {debt.priority}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">
                        {loanTypeLabel}
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">
                        {formatMoney(debt.currentBalance)}
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">
                        {formatMoney(debt.monthlyPayment)}
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">
                        {debt.interestRate.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="relative flex-1 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full transition-all",
                                progressPct >= 100 ? "bg-sentiment-positive" : "bg-interactive-primary"
                              )}
                              style={{ width: `${clampedProgress}%` }}
                            />
                          </div>
                          <span className="text-xs whitespace-nowrap">
                            {progressPct.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">
                        {debt.monthsRemaining !== null && debt.monthsRemaining !== undefined
                          ? `${Math.ceil(debt.monthsRemaining)}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {debt.isPaidOff && (
                            <Badge variant="default" className="bg-sentiment-positive text-white text-xs">
                              Paid Off
                            </Badge>
                          )}
                          {debt.isPaused && (
                            <Badge variant="outline" className="border-sentiment-warning text-sentiment-warning text-xs">
                              Paused
                            </Badge>
                          )}
                          {!debt.isPaidOff && !debt.isPaused && (
                            <Badge variant="outline" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {canWrite && (
                          <div className="flex space-x-1 md:space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 md:h-10 md:w-10"
                              onClick={() => {
                                if (!checkWriteAccess()) return;
                                setSelectedDebt({ ...debt, createdAt: debt.createdAt, updatedAt: debt.updatedAt });
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 md:h-10 md:w-10"
                              onClick={() => {
                                if (!checkWriteAccess()) return;
                                if (pausingId !== debt.id) {
                                  handlePause(debt.id, debt.isPaused);
                                }
                              }}
                              disabled={pausingId === debt.id || debt.isPaidOff}
                            >
                              {pausingId === debt.id ? (
                                <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                              ) : debt.isPaused ? (
                                <Play className="h-3 w-3 md:h-4 md:w-4" />
                              ) : (
                                <Pause className="h-3 w-3 md:h-4 md:w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 md:h-10 md:w-10"
                              onClick={() => {
                                if (!checkWriteAccess()) return;
                                handlePayment(debt.id);
                              }}
                              disabled={debt.isPaidOff || debt.isPaused}
                            >
                              <DollarSign className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 md:h-10 md:w-10"
                              onClick={() => {
                                if (!checkWriteAccess()) return;
                                if (deletingId !== debt.id) {
                                  handleDelete(debt.id);
                                }
                              }}
                              disabled={deletingId === debt.id}
                            >
                              {deletingId === debt.id ? (
                                <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

      <DebtForm
        debt={selectedDebt || undefined}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setSelectedDebt(null);
          }
        }}
        onSuccess={() => {
          loadDebts();
          setSelectedDebt(null);
        }}
      />

      <RecordPaymentDialog
        open={isPaymentOpen}
        onOpenChange={(open) => {
          setIsPaymentOpen(open);
          if (!open) {
            setSelectedDebt(null);
          }
        }}
        debt={selectedDebt}
        onConfirm={async (amount) => {
          if (!selectedDebt) return;
          setPaymentLoading(true);
          try {
            const response = await fetch(`/api/v2/debts/${selectedDebt.id}/payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ amount }),
            });
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Failed to add payment");
            }

            setIsPaymentOpen(false);
            setSelectedDebt(null);
            loadDebts();
          } catch (error) {
            console.error("Error adding payment:", error);
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "Failed to add payment",
              variant: "destructive",
            });
          } finally {
            setPaymentLoading(false);
          }
        }}
        loading={paymentLoading}
      />
      {ConfirmDialog}
      </div>

      {/* Mobile Add bar - fixed above bottom nav */}
      {canWrite && (
        <MobileAddBar>
          <Button
            size="mobileAdd"
            onClick={() => {
              if (!checkWriteAccess()) return;
              setSelectedDebt(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Debt
          </Button>
        </MobileAddBar>
      )}
    </div>
  );
}

