"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/utils/api-base-url";
import { usePagePerformance } from "@/hooks/use-page-performance";
import { SubscriptionCard } from "@/components/subscriptions/subscription-card";
import { SubscriptionForm } from "@/components/forms/subscription-form";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Edit, Trash2, Pause, Play, MoreVertical, Search, Check, X, ArrowLeft, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { MobileAddBar } from "@/components/common/mobile-add-bar";
import { PageHeader } from "@/components/common/page-header";
import { useWriteGuard } from "@/hooks/use-write-guard";
import type { UserServiceSubscription } from "@/src/domain/subscriptions/subscriptions.types";
import type { DetectedSubscription } from "@/src/domain/subscriptions/subscriptions.types";
import { useToast } from "@/components/toast-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/components/common/money";

export default function SubscriptionsPage() {
  const t = useTranslations("nav");
  const tSub = useTranslations("subscriptions");
  const tCommon = useTranslations("common");
  const perf = usePagePerformance("Subscriptions");
  const { openDialog, ConfirmDialog } = useConfirmDialog();
  const { checkWriteAccess, canWrite } = useWriteGuard();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<UserServiceSubscription[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<UserServiceSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pausingId, setPausingId] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedSubscriptions, setDetectedSubscriptions] = useState<DetectedSubscription[]>([]);
  const [isDetectionDialogOpen, setIsDetectionDialogOpen] = useState(false);
  const [selectedDetectedSubscriptions, setSelectedDetectedSubscriptions] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [viewingSubscriptionIndex, setViewingSubscriptionIndex] = useState<number | null>(null);
  const [subscriptionTransactions, setSubscriptionTransactions] = useState<Array<{
    id: string;
    date: string;
    amount: number;
    description: string | null;
    account: { id: string; name: string } | null;
  }>>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<Set<string>>(new Set());
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  async function loadSubscriptions(signal?: AbortSignal) {
    try {
      setLoading(true);
      const response = await fetch(apiUrl("/api/v2/user-subscriptions"), { signal });
      if (!response.ok) {
        throw new Error("Failed to fetch subscriptions");
      }
      const data = await response.json();
      setSubscriptions(data);
      setHasLoaded(true);
      perf.markDataLoaded();
    } catch (error) {
      if (signal?.aborted || (error as Error).name === "AbortError") return;
      console.error("Error loading subscriptions:", error);
      setHasLoaded(true);
      perf.markDataLoaded();
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const ac = new AbortController();
    loadSubscriptions(ac.signal);
    return () => ac.abort();
  }, []);

  function handleDelete(id: string) {
    openDialog(
      {
        title: tSub("deleteSubscription"),
        description: tSub("deleteSubscriptionConfirm"),
        variant: "destructive",
        confirmLabel: tCommon("delete"),
      },
      async () => {
        setDeletingId(id);
        try {
          const response = await fetch(apiUrl(`/api/v2/user-subscriptions/${id}`), {
            method: "DELETE",
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to delete subscription");
          }
          toast({
            title: tSub("subscriptionDeleted"),
            variant: "success",
          });
          loadSubscriptions();
          setSelectedSubscriptions(new Set());
        } catch (error) {
          console.error("Error deleting subscription:", error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to delete subscription",
            variant: "destructive",
          });
        } finally {
          setDeletingId(null);
        }
      }
    );
  }

  function handleBulkDelete() {
    const count = selectedSubscriptions.size;
    openDialog(
      {
        title: tSub("deleteSubscriptions"),
        description: tSub("deleteSubscriptionsConfirm", { count }),
        variant: "destructive",
        confirmLabel: tCommon("delete"),
      },
      async () => {
        setIsDeletingMultiple(true);
        const idsToDelete = Array.from(selectedSubscriptions);
        let successCount = 0;
        let errorCount = 0;

        try {
          for (const id of idsToDelete) {
            try {
              const response = await fetch(apiUrl(`/api/v2/user-subscriptions/${id}`), {
            method: "DELETE",
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to delete subscription");
          }
              successCount++;
            } catch (error) {
              console.error(`Error deleting subscription ${id}:`, error);
              errorCount++;
            }
          }

          if (successCount > 0) {
            toast({
              title: tSub("successfullyDeletedCount", { count: successCount }),
              description: errorCount > 0 ? tSub("someFailed", { count: errorCount }) : undefined,
              variant: "success",
            });
            loadSubscriptions();
            setSelectedSubscriptions(new Set());
          } else {
            toast({
              title: "Error",
              description: tSub("failedToDeleteSubscriptions", { count: errorCount }),
              variant: "destructive",
            });
          }
        } finally {
          setIsDeletingMultiple(false);
        }
      }
    );
  }

  function toggleSubscriptionSelection(id: string) {
    const newSet = new Set(selectedSubscriptions);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSubscriptions(newSet);
  }

  function toggleSelectAll() {
    if (selectedSubscriptions.size === filteredSubscriptions.length) {
      setSelectedSubscriptions(new Set());
    } else {
      setSelectedSubscriptions(new Set(filteredSubscriptions.map(s => s.id)));
    }
  }

  async function handlePause(id: string) {
    setPausingId(id);
    try {
      const response = await fetch(apiUrl(`/api/v2/user-subscriptions/${id}/pause`), {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to pause subscription");
      }
      toast({
        title: tSub("subscriptionPaused"),
        variant: "success",
      });
      loadSubscriptions();
    } catch (error) {
      console.error("Error pausing subscription:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to pause subscription",
        variant: "destructive",
      });
    } finally {
      setPausingId(null);
    }
  }

  async function handleResume(id: string) {
    setPausingId(id);
    try {
      const response = await fetch(apiUrl(`/api/v2/user-subscriptions/${id}/resume`), {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resume subscription");
      }
      toast({
        title: tSub("subscriptionResumed"),
        variant: "success",
      });
      loadSubscriptions();
    } catch (error) {
      console.error("Error resuming subscription:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resume subscription",
        variant: "destructive",
      });
    } finally {
      setPausingId(null);
    }
  }

  // Show all subscriptions (filter removed)
  const filteredSubscriptions = subscriptions;

  // Helper functions for formatting (use translations)
  const getBillingFrequencyLabel = (key: string) => {
    const k = key as keyof typeof billingFrequencyKeyMap;
    return billingFrequencyKeyMap[k] ? tSub(billingFrequencyKeyMap[k]) : key;
  };
  const billingFrequencyKeyMap: Record<string, string> = {
    monthly: "monthly",
    biweekly: "biweekly",
    weekly: "weekly",
    semimonthly: "semimonthly",
    daily: "daily",
    yearly: "yearly",
  };
  const dayOfWeekKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const getBillingDayLabel = (subscription: UserServiceSubscription) => {
    if (!subscription.billingDay) return null;
    if (subscription.billingFrequency === "monthly" || subscription.billingFrequency === "yearly" || subscription.billingFrequency === "semimonthly") {
      return tSub("day", { n: subscription.billingDay });
    }
    if (subscription.billingFrequency === "weekly" || subscription.billingFrequency === "biweekly") {
      return dayOfWeekKeys[subscription.billingDay] ? tSub(dayOfWeekKeys[subscription.billingDay]) : tSub("day", { n: subscription.billingDay });
    }
    return null;
  };

  const formatFirstBillingDate = (date: string | null | undefined): string => {
    if (!date) return "—";
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? "—" : parsedDate.toLocaleDateString();
  };

  async function handleDetectSubscriptions() {
    if (!checkWriteAccess()) return;
    
    setIsDetecting(true);
    try {
      const response = await fetch(apiUrl("/api/subscriptions/detect"), {
        method: "GET",
      });
      if (!response.ok) {
        let errorMessage = "Failed to detect subscriptions";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (parseError) {
          // If parsing fails, use status text or default message
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      const detected = data.subscriptions || [];
      setDetectedSubscriptions(detected);
      setSelectedDetectedSubscriptions(new Set(detected.map((s: DetectedSubscription, i: number) => i.toString())));
      setIsDetectionDialogOpen(true);
    } catch (error) {
      console.error("Error detecting subscriptions:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to detect subscriptions",
        variant: "destructive",
      });
    } finally {
      setIsDetecting(false);
    }
  }

  async function handleImportDetectedSubscriptions() {
    if (selectedDetectedSubscriptions.size === 0) {
      toast({
        title: tSub("noSubscriptionsSelected"),
        description: tSub("selectAtLeastOne"),
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const indexStr of selectedDetectedSubscriptions) {
        const index = parseInt(indexStr);
        const detected = detectedSubscriptions[index];
        
        if (!detected) continue;

        try {
          const createResponse = await fetch(apiUrl("/api/v2/user-subscriptions"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
            serviceName: detected.merchantName,
            amount: detected.amount,
            billingFrequency: detected.frequency,
            billingDay: detected.billingDay || null,
            accountId: detected.accountId,
            firstBillingDate: new Date(detected.firstBillingDate),
            description: detected.description || null,
          }),
        });
        if (!createResponse.ok) {
          const error = await createResponse.json();
          throw new Error(error.error || "Failed to create subscription");
        }
          successCount++;
        } catch (error) {
          console.error(`Error importing subscription ${detected.merchantName}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: tSub("successfullyImportedCount", { count: successCount }),
          description: errorCount > 0 ? tSub("someFailed", { count: errorCount }) : undefined,
          variant: "success",
        });
        setIsDetectionDialogOpen(false);
        loadSubscriptions();
      } else {
        toast({
          title: "Error",
          description: tSub("failedToImportSubscriptions", { count: errorCount }),
          variant: "destructive",
        });
      }
    } finally {
      setIsImporting(false);
    }
  }

  function toggleDetectedSubscription(index: string) {
    const newSet = new Set(selectedDetectedSubscriptions);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedDetectedSubscriptions(newSet);
  }

  async function handleViewTransactions(index: number) {
    const detected = detectedSubscriptions[index];
    if (!detected || !detected.transactionIds || detected.transactionIds.length === 0) {
      toast({
        title: "Error",
        description: "No transactions found for this subscription",
        variant: "destructive",
      });
      return;
    }

    setLoadingTransactions(true);
    setViewingSubscriptionIndex(index);

    try {
      const response = await fetch(apiUrl("/api/v2/transactions/by-ids"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: detected.transactionIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const transactions = await response.json();
      setSubscriptionTransactions(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load transactions",
        variant: "destructive",
      });
      setViewingSubscriptionIndex(null);
    } finally {
      setLoadingTransactions(false);
    }
  }

  function handleBackToSubscriptions() {
    setViewingSubscriptionIndex(null);
    setSubscriptionTransactions([]);
  }

  return (
    <div>
      <PageHeader
        title={t("items.subscriptions")}
      />

      <div className="w-full p-4 lg:p-8 pb-32 lg:pb-8">
        {/* Action Buttons - Moved from header */}
        <div className="flex items-center gap-2 justify-end mb-6 flex-wrap">
          {selectedSubscriptions.size > 0 && canWrite && (
            <Button
              size="medium"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isDeletingMultiple}
            >
              {isDeletingMultiple ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tSub("deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {tSub("deleteCount", { count: selectedSubscriptions.size })}
                </>
              )}
            </Button>
          )}
          {canWrite && (
            <Button
              size="medium"
              variant="outline"
              onClick={handleDetectSubscriptions}
              disabled={isDetecting}
            >
              {isDetecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tSub("detecting")}
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  {tSub("detectSubscriptions")}
                </>
              )}
            </Button>
          )}
          {canWrite && (
            <Button
              size="medium"
              className="hidden lg:inline-flex"
              onClick={() => {
                if (!checkWriteAccess()) return;
                setSelectedSubscription(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {tSub("createSubscription")}
            </Button>
          )}
        </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2].map((j) => (
                        <div key={j} className="space-y-1">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="w-full h-full min-h-[400px]">
            <EmptyState
              icon={Plus}
              title={tSub("noSubscriptionsYet")}
              description={tSub("noSubscriptionsYetDescription")}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {filteredSubscriptions.map((subscription) => {
              const isSelected = selectedSubscriptions.has(subscription.id);
              return (
                <div key={subscription.id} className="relative">
                  {canWrite && (
                    <div className="absolute top-4 left-4 z-10">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSubscriptionSelection(subscription.id)}
                        className="bg-background"
                      />
                    </div>
                  )}
                  <SubscriptionCard
                    subscription={subscription}
                    onEdit={(sub) => {
                      if (!checkWriteAccess()) return;
                      setSelectedSubscription(sub);
                      setIsFormOpen(true);
                    }}
                    onDelete={(id) => {
                      if (!checkWriteAccess()) return;
                      if (deletingId !== id) {
                        handleDelete(id);
                      }
                    }}
                    onPause={(id) => {
                      if (pausingId !== id) {
                        handlePause(id);
                      }
                    }}
                    onResume={(id) => {
                      if (pausingId !== id) {
                        handleResume(id);
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className={`hidden lg:block rounded-lg overflow-x-auto ${filteredSubscriptions.length > 0 || loading ? 'border' : ''}`}>
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                {canWrite && <TableHead className="w-12" />}
                <TableHead className="text-xs md:text-sm">{tSub("category")}</TableHead>
                <TableHead className="text-xs md:text-sm">{tSub("service")}</TableHead>
                <TableHead className="text-xs md:text-sm">{tSub("amount")}</TableHead>
                <TableHead className="text-xs md:text-sm">{tSub("frequency")}</TableHead>
                <TableHead className="text-xs md:text-sm">{tSub("account")}</TableHead>
                <TableHead className="text-xs md:text-sm">{tSub("status")}</TableHead>
                <TableHead className="text-xs md:text-sm">{tSub("firstBilling")}</TableHead>
                <TableHead className="text-xs md:text-sm">{tSub("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4].map((i) => (
                <TableRow key={i}>
                  {canWrite && <TableCell><Skeleton className="h-4 w-4" /></TableCell>}
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="w-full h-full min-h-[400px]">
            <EmptyState
              icon={Plus}
              title={tSub("noSubscriptionsYet")}
              description={tSub("noSubscriptionsYetDescription")}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {canWrite && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedSubscriptions.size === filteredSubscriptions.length && filteredSubscriptions.length > 0}
                      onCheckedChange={toggleSelectAll}
                      disabled={isDeletingMultiple}
                    />
                  </TableHead>
                )}
                <TableHead className="text-xs md:text-sm">{tSub("category")}</TableHead>
                <TableHead className="text-xs md:text-sm">{tSub("service")}</TableHead>
                <TableHead className="text-xs md:text-sm">{tSub("amount")}</TableHead>
                <TableHead className="text-xs md:text-sm">{tSub("frequency")}</TableHead>
                <TableHead className="text-xs md:text-sm">{tSub("account")}</TableHead>
                <TableHead className="text-xs md:text-sm">{tSub("status")}</TableHead>
                <TableHead className="text-xs md:text-sm">{tSub("firstBilling")}</TableHead>
                <TableHead className="text-xs md:text-sm">{tSub("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((subscription) => {
                const frequencyLabel = subscription.billingFrequency 
                  ? getBillingFrequencyLabel(subscription.billingFrequency)
                  : "—";
                const billingDayLabel = getBillingDayLabel(subscription);
                const isSelected = selectedSubscriptions.has(subscription.id);
                
                return (
                  <TableRow 
                    key={subscription.id} 
                    className={`${!subscription.isActive ? "opacity-75" : ""} ${isSelected ? "bg-muted/50" : ""}`}
                  >
                    {canWrite && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSubscriptionSelection(subscription.id)}
                          disabled={isDeletingMultiple}
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                      {subscription.subscriptionCategoryName || subscription.category?.name || subscription.subcategory?.name || "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {subscription.serviceLogo && (
                          <img
                            src={subscription.serviceLogo}
                            alt={subscription.serviceName || ""}
                            className="h-8 w-8 object-contain rounded flex-shrink-0"
                            onError={(e) => {
                              // Hide image if it fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="truncate">{subscription.serviceName?.trim() || "—"}</span>
                        {subscription.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {subscription.description}
                          </span>
                        )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatMoney(subscription.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="text-xs w-fit">
                          {frequencyLabel}
                        </Badge>
                        {billingDayLabel && (
                          <span className="text-xs text-muted-foreground">
                            {billingDayLabel}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {subscription.account?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      {subscription.isActive ? (
                        <Badge variant="outline" className="border-green-500 dark:border-green-400 text-sentiment-positive">
                          {tSub("active")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-yellow-500 dark:border-yellow-400 text-yellow-600 dark:text-yellow-400">
                          {tSub("paused")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFirstBillingDate(subscription.firstBillingDate)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canWrite && (
                            <DropdownMenuItem
                              onClick={() => {
                                if (!checkWriteAccess()) return;
                                setSelectedSubscription(subscription);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              {tSub("edit")}
                            </DropdownMenuItem>
                          )}
                          {subscription.isActive ? (
                            <DropdownMenuItem
                              onClick={() => {
                                if (pausingId !== subscription.id) {
                                  handlePause(subscription.id);
                                }
                              }}
                              disabled={pausingId === subscription.id}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              {tSub("pause")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                if (pausingId !== subscription.id) {
                                  handleResume(subscription.id);
                                }
                              }}
                              disabled={pausingId === subscription.id}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              {tSub("resume")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              if (!checkWriteAccess()) return;
                              if (deletingId !== subscription.id) {
                                handleDelete(subscription.id);
                              }
                            }}
                            className="text-destructive focus:text-destructive"
                            disabled={deletingId === subscription.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {tSub("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      </div>

      <SubscriptionForm
        subscription={selectedSubscription || undefined}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setSelectedSubscription(null);
          }
        }}
        onSuccess={() => {
          loadSubscriptions();
          setSelectedSubscription(null);
        }}
      />

      {/* Detection Dialog */}
      <Dialog 
        open={isDetectionDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsDetectionDialogOpen(false);
            setViewingSubscriptionIndex(null);
            setSubscriptionTransactions([]);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {viewingSubscriptionIndex === null ? (
            <>
              <DialogHeader>
                <DialogTitle>{tSub("detectedSubscriptions")}</DialogTitle>
                <DialogDescription>
                  {tSub("detectedSubscriptionsDescription", { count: detectedSubscriptions.length })}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4 px-6">
            {detectedSubscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {tSub("noSubscriptionsDetected")}
              </div>
            ) : (
              detectedSubscriptions.map((detected, index) => {
                const isSelected = selectedDetectedSubscriptions.has(index.toString());
                const confidenceColors = {
                  high: "bg-sentiment-positive/10 text-sentiment-positive",
                  medium: "bg-sentiment-warning/10 text-sentiment-warning",
                  low: "bg-sentiment-warning/10 text-sentiment-warning",
                };
                
                return (
                  <Card key={index} className={isSelected ? "border-primary" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleDetectedSubscription(index.toString())}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {detected.logoUrl && (
                              <img
                                src={detected.logoUrl}
                                alt={detected.merchantName}
                                className="h-10 w-10 object-contain rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold">{detected.merchantName}</h4>
                              <p className="text-sm text-muted-foreground">{detected.accountName}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{formatMoney(detected.amount)}</div>
                              <div className="text-xs text-muted-foreground">
                                {getBillingFrequencyLabel(detected.frequency)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className={confidenceColors[detected.confidence]}>
                              {detected.confidence} {tSub("confidence")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {tSub("transactionsCount", { count: detected.transactionCount })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {tSub("first")}: {formatFirstBillingDate(detected.firstBillingDate)}
                            </span>
                            {detected.billingDay !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                {detected.frequency === "monthly" || detected.frequency === "semimonthly"
                                  ? tSub("day", { n: detected.billingDay })
                                  : dayOfWeekKeys[detected.billingDay] ? tSub(dayOfWeekKeys[detected.billingDay]) : tSub("day", { n: detected.billingDay })}
                              </span>
                            )}
                          </div>
                          
                          {detected.description && (
                            <p className="text-xs text-muted-foreground mt-2">{detected.description}</p>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="medium"
                            className="mt-3 text-xs"
                            onClick={() => handleViewTransactions(index)}
                          >
                            <Receipt className="mr-2 h-3 w-3" />
                            {tSub("viewTransactions", { count: detected.transactionCount })}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetectionDialogOpen(false)}
              disabled={isImporting}
            >
              {tSub("cancel")}
            </Button>
            <Button
              onClick={handleImportDetectedSubscriptions}
              disabled={isImporting || selectedDetectedSubscriptions.size === 0}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tSub("importing")}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {tSub("importSelected", { count: selectedDetectedSubscriptions.size })}
                </>
              )}
            </Button>
          </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToSubscriptions}
                    className="h-8 w-8"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <DialogTitle>
                      {detectedSubscriptions[viewingSubscriptionIndex]?.merchantName} - {tSub("transactions")}
                    </DialogTitle>
                    <DialogDescription>
                      {tSub("transactionsUsedForDetection", { count: subscriptionTransactions.length })}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="py-4 px-6">
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : subscriptionTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {tSub("noTransactionsFound")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subscriptionTransactions.map((tx) => (
                      <Card key={tx.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{tx.description || tSub("noDescription")}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {tx.account?.name || tSub("unknownAccount")}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-semibold">{formatMoney(tx.amount)}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(tx.date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {ConfirmDialog}

      {/* Mobile Add bar - fixed above bottom nav */}
      {canWrite && (
        <MobileAddBar>
          <Button
            size="mobileAdd"
            onClick={() => {
              if (!checkWriteAccess()) return;
              setSelectedSubscription(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {tSub("createSubscription")}
          </Button>
        </MobileAddBar>
      )}
    </div>
  );
}

