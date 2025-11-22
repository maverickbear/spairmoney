"use client";

import { useState, useEffect } from "react";
import { usePagePerformance } from "@/hooks/use-page-performance";
import { SubscriptionCard } from "@/components/subscriptions/subscription-card";
import { SubscriptionForm } from "@/components/forms/subscription-form";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Edit, Trash2, Pause, Play, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { useWriteGuard } from "@/hooks/use-write-guard";
import {
  getUserSubscriptionsClient,
  deleteUserSubscriptionClient,
  pauseUserSubscriptionClient,
  resumeUserSubscriptionClient,
  type UserServiceSubscription,
} from "@/lib/api/user-subscriptions-client";
import { useToast } from "@/components/toast-provider";
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

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    try {
      setLoading(true);
      const data = await getUserSubscriptionsClient();
      setSubscriptions(data);
      setHasLoaded(true);
      perf.markDataLoaded();
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      setHasLoaded(true);
      perf.markDataLoaded();
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string) {
    openDialog(
      {
        title: "Delete Subscription",
        description: "Are you sure you want to delete this subscription? This will also delete all associated planned payments.",
        variant: "destructive",
        confirmLabel: "Delete",
      },
      async () => {
        setDeletingId(id);
        try {
          await deleteUserSubscriptionClient(id);
          toast({
            title: "Success",
            description: "Subscription deleted successfully",
            variant: "success",
          });
          loadSubscriptions();
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

  async function handlePause(id: string) {
    setPausingId(id);
    try {
      await pauseUserSubscriptionClient(id);
      toast({
        title: "Success",
        description: "Subscription paused successfully",
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
      await resumeUserSubscriptionClient(id);
      toast({
        title: "Success",
        description: "Subscription resumed successfully",
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

  // Helper functions for formatting
  const billingFrequencyLabels: Record<string, string> = {
    monthly: "Monthly",
    biweekly: "Biweekly",
    weekly: "Weekly",
    semimonthly: "Semimonthly",
    daily: "Daily",
    yearly: "Yearly",
  };

  const dayOfWeekLabels: Record<number, string> = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };

  const getBillingDayLabel = (subscription: UserServiceSubscription) => {
    if (!subscription.billingDay) return null;
    
    if (subscription.billingFrequency === "monthly" || subscription.billingFrequency === "semimonthly") {
      return `Day ${subscription.billingDay}`;
    } else if (subscription.billingFrequency === "weekly" || subscription.billingFrequency === "biweekly") {
      return dayOfWeekLabels[subscription.billingDay] || `Day ${subscription.billingDay}`;
    }
    return null;
  };

  return (
    <div>
      <PageHeader
        title="Subscriptions"
      >
        {filteredSubscriptions.length > 0 && canWrite && (
          <Button
            size="medium"
            onClick={() => {
              if (!checkWriteAccess()) return;
              setSelectedSubscription(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Subscription
          </Button>
        )}
      </PageHeader>

      <div className="w-full p-4 lg:p-8">

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {loading && subscriptions.length > 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {filteredSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
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
            ))}

            {filteredSubscriptions.length === 0 && (
              <div className="col-span-full w-full h-full min-h-[400px]">
                <EmptyState
                  icon={Plus}
                  title="No subscriptions created yet"
                  description="Create your first subscription to start tracking recurring service payments."
                  actionLabel={canWrite ? "Create Your First Subscription" : undefined}
                  onAction={canWrite ? () => {
                          if (!checkWriteAccess()) return;
                          setSelectedSubscription(null);
                          setIsFormOpen(true);
                  } : undefined}
                  actionIcon={canWrite ? Plus : undefined}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className={`hidden lg:block rounded-[12px] overflow-x-auto ${filteredSubscriptions.length > 0 || (loading && subscriptions.length > 0) ? 'border' : ''}`}>
        {loading && subscriptions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs md:text-sm">Service</TableHead>
                <TableHead className="text-xs md:text-sm">Amount</TableHead>
                <TableHead className="text-xs md:text-sm">Frequency</TableHead>
                <TableHead className="text-xs md:text-sm">Account</TableHead>
                <TableHead className="text-xs md:text-sm">Category</TableHead>
                <TableHead className="text-xs md:text-sm">Status</TableHead>
                <TableHead className="text-xs md:text-sm">First Billing</TableHead>
                <TableHead className="text-xs md:text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : filteredSubscriptions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs md:text-sm">Service</TableHead>
                <TableHead className="text-xs md:text-sm">Amount</TableHead>
                <TableHead className="text-xs md:text-sm">Frequency</TableHead>
                <TableHead className="text-xs md:text-sm">Account</TableHead>
                <TableHead className="text-xs md:text-sm">Category</TableHead>
                <TableHead className="text-xs md:text-sm">Status</TableHead>
                <TableHead className="text-xs md:text-sm">First Billing</TableHead>
                <TableHead className="text-xs md:text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((subscription) => {
                const frequencyLabel = billingFrequencyLabels[subscription.billingFrequency] || subscription.billingFrequency;
                const billingDayLabel = getBillingDayLabel(subscription);
                
                return (
                  <TableRow key={subscription.id} className={!subscription.isActive ? "opacity-75" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {subscription.serviceLogo && (
                          <img
                            src={subscription.serviceLogo}
                            alt={subscription.serviceName}
                            className="h-8 w-8 object-contain rounded flex-shrink-0"
                            onError={(e) => {
                              // Hide image if it fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="truncate">{subscription.serviceName}</span>
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
                      {subscription.plan?.planName || subscription.subcategory?.name || "—"}
                    </TableCell>
                    <TableCell>
                      {subscription.isActive ? (
                        <Badge variant="outline" className="border-green-500 dark:border-green-400 text-green-600 dark:text-green-400">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-yellow-500 dark:border-yellow-400 text-yellow-600 dark:text-yellow-400">
                          Paused
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(subscription.firstBillingDate).toLocaleDateString()}
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
                              Edit
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
                              Pause
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
                              Resume
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
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="w-full h-full min-h-[400px]">
            <EmptyState
              icon={Plus}
              title="No subscriptions created yet"
              description="Create your first subscription to start tracking recurring service payments."
              actionLabel={canWrite ? "Create Your First Subscription" : undefined}
              onAction={canWrite ? () => {
                      if (!checkWriteAccess()) return;
                      setSelectedSubscription(null);
                      setIsFormOpen(true);
              } : undefined}
              actionIcon={canWrite ? Plus : undefined}
            />
          </div>
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
      {ConfirmDialog}
    </div>
  );
}

