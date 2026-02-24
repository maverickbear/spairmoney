"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/utils/api-base-url";
import { Button } from "@/components/ui/button";
import { FeatureGuard } from "@/components/common/feature-guard";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Plus, Edit as EditIcon, Trash2, Crown, Mail, Users, Loader2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MemberForm } from "@/components/members/member-form";
import type { HouseholdMember } from "@/src/domain/members/members.types";
import { EmptyState } from "@/components/common/empty-state";
import { useAuthSafe } from "@/contexts/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InvitationStatus } from "@/components/members/invitation-status";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useWriteGuard } from "@/hooks/use-write-guard";

// Members helper
function getInitials(name: string | null | undefined): string {
  if (!name) return "M";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name[0].toUpperCase();
}

export interface HouseholdModuleProps {
  /** When true, opens the invite form (e.g. from page MobileAddBar). */
  externalInviteOpen?: boolean;
  /** Called when the invite form closes so the page can sync state. */
  onExternalInviteOpenChange?: (open: boolean) => void;
}

export function HouseholdModule({ externalInviteOpen, onExternalInviteOpenChange }: HouseholdModuleProps = {}) {
  const t = useTranslations("members");
  const { openDialog, ConfirmDialog } = useConfirmDialog();
  const { checkWriteAccess, canWrite } = useWriteGuard();
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<HouseholdMember | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { role: currentUserRole } = useAuthSafe();

  // Fetch members once on mount; no dependency on subscription to avoid repeated reloads
  useEffect(() => {
    let cancelled = false;
    async function fetchMembers() {
      setLoading(true);
      try {
        const response = await fetch(apiUrl("/api/v2/members"));
        if (cancelled) return;
        if (!response.ok) throw new Error("Failed to fetch members data");
        const { members: data } = await response.json();
        setMembers(data ?? []);
      } catch (error) {
        if (!cancelled) console.error("Error loading data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMembers();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync external invite state from page (e.g. MobileAddBar) into the form
  useEffect(() => {
    if (externalInviteOpen) {
      setEditingMember(undefined);
      setIsFormOpen(true);
    }
  }, [externalInviteOpen]);

  /** Refetch members after mutations (delete, invite, edit). Not used on initial load. */
  async function loadData() {
    try {
      setLoading(true);
      const response = await fetch(apiUrl("/api/v2/members"));
      if (!response.ok) throw new Error("Failed to fetch members data");
      const { members: data } = await response.json();
      setMembers(data ?? []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(member: HouseholdMember) {
    if (!checkWriteAccess()) return;
    openDialog(
      {
        title: t("removeMember"),
        description: t("removeMemberConfirm", { name: member.name || member.email }),
        variant: "destructive",
        confirmLabel: t("remove"),
      },
      async () => {
        setDeletingId(member.id);
        try {
          const response = await fetch(`/api/v2/members/${member.id}`, {
            method: "DELETE",
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to remove member");
          }
          loadData();
        } catch (error) {
          console.error("Error removing member:", error);
          alert(error instanceof Error ? error.message : "Failed to remove member");
        } finally {
          setDeletingId(null);
        }
      }
    );
  }

  async function handleResend(member: HouseholdMember) {
    if (!checkWriteAccess()) return;
    try {
      const res = await fetch(`/api/v2/members/${member.id}/resend`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to resend invitation");
      }

      alert(t("invitationResentSuccess"));
    } catch (error) {
      console.error("Error resending invitation:", error);
      alert(error instanceof Error ? error.message : "Failed to resend invitation");
    }
  }

  function handleEdit(member: HouseholdMember) {
    if (!checkWriteAccess()) return;
    setEditingMember(member);
    setIsFormOpen(true);
  }

  function handleFormClose() {
    onExternalInviteOpenChange?.(false);
    setIsFormOpen(false);
    setEditingMember(undefined);
  }

  function handleFormSuccess() {
    loadData();
    handleFormClose();
  }

  return (
    <FeatureGuard 
      feature="hasHousehold"
      headerTitle={t("householdMembers")}
    >
      <div>
        <div className="hidden lg:flex items-center justify-end mb-4">
          {(currentUserRole === "admin" || currentUserRole === "super_admin" || currentUserRole === null) && members.length > 0 && canWrite && (
            <Button
              size="medium"
              onClick={() => {
                if (!checkWriteAccess()) return;
                if (onExternalInviteOpenChange) {
                  onExternalInviteOpenChange(true);
                } else {
                  setIsFormOpen(true);
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("inviteMember")}
            </Button>
          )}
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : members.length === 0 ? (
          <div className="w-full h-full min-h-[400px]">
            <EmptyState
              icon={Users}
              title={t("noMembersYet")}
              description={t("noMembersYetDescription")}
            />
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="space-y-3 lg:hidden">
              {members.map((member) => (
                <Card key={member.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 gap-3">
                        <div className="relative flex-shrink-0">
                          {member.avatarUrl ? (
                            <>
                              <img
                                src={member.avatarUrl}
                                alt={member.name || member.email}
                                className="h-11 w-11 rounded-full object-cover border-2 border-border"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const initialsContainer = e.currentTarget.nextElementSibling;
                                  if (initialsContainer) {
                                    (initialsContainer as HTMLElement).style.display = "flex";
                                  }
                                }}
                              />
                              <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground hidden items-center justify-center text-sm font-semibold border-2 border-border">
                                {getInitials(member.name)}
                              </div>
                            </>
                          ) : (
                            <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold border-2 border-border">
                              {getInitials(member.name)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-foreground truncate">
                              {member.name || member.email}
                            </span>
                            {member.isOwner && (
                              <Badge variant="default" className="flex shrink-0 items-center gap-1">
                                <Crown className="h-3 w-3" />
                                {t("owner")}
                              </Badge>
                            )}
                            {member.isOwner ? (
                              <Badge variant="default" className="rounded-full border-border bg-white text-gray-900 hover:bg-gray-50 text-xs shrink-0">
                                {t("admin")}
                              </Badge>
                            ) : (
                              <Badge
                                variant={member.role === "admin" ? "default" : "secondary"}
                                className={`text-xs shrink-0 ${member.role === "admin" ? "rounded-full border-border bg-white text-gray-900 hover:bg-gray-50" : ""}`}
                              >
                                {member.role === "admin" ? t("admin") : t("member")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {member.isOwner ? (
                              <>
                                <Badge variant="secondary" className="rounded-full bg-primary text-primary-foreground border-transparent text-xs">
                                  {t("active")}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {t("since")} {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "N/A"}
                                </span>
                              </>
                            ) : (
                              <>
                                <InvitationStatus status={member.status} />
                                <span className="text-xs text-muted-foreground">
                                  {member.status === "pending"
                                    ? `${t("invited")} ${member.invitedAt ? new Date(member.invitedAt).toLocaleDateString() : "N/A"}`
                                    : member.acceptedAt
                                      ? `${t("joined")} ${new Date(member.acceptedAt).toLocaleDateString()}`
                                      : "—"}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {!member.isOwner &&
                        (currentUserRole === "admin" || currentUserRole === "super_admin" || currentUserRole === null) &&
                        canWrite && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {member.status === "pending" && (
                                <DropdownMenuItem onClick={() => handleResend(member)}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  {t("resend")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleEdit(member)}>
                                <EditIcon className="h-4 w-4 mr-2" />
                                {t("edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(member)}
                                disabled={deletingId === member.id}
                                className="text-destructive focus:text-destructive"
                              >
                                {deletingId === member.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                {t("delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden lg:block rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">{t("memberLabel")}</TableHead>
                    <TableHead className="text-xs md:text-sm">{t("email")}</TableHead>
                    <TableHead className="text-xs md:text-sm">{t("role")}</TableHead>
                    <TableHead className="text-xs md:text-sm">{t("statusLabel")}</TableHead>
                    <TableHead className="text-xs md:text-sm">{t("date")}</TableHead>
                    <TableHead className="text-xs md:text-sm">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium text-xs md:text-sm">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            {member.avatarUrl ? (
                              <>
                                <img
                                  src={member.avatarUrl}
                                  alt={member.name || member.email}
                                  className="h-10 w-10 rounded-full object-cover border-2"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const initialsContainer = e.currentTarget.nextElementSibling;
                                    if (initialsContainer) {
                                      (initialsContainer as HTMLElement).style.display = "flex";
                                    }
                                  }}
                                />
                                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground hidden items-center justify-center text-sm font-semibold border-2">
                                  {getInitials(member.name)}
                                </div>
                              </>
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold border-2">
                                {getInitials(member.name)}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span>{member.name || member.email}</span>
                              {member.isOwner && (
<Badge variant="default" className="flex items-center gap-1">
                                <Crown className="h-3 w-3" />
                                {t("owner")}
                              </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs md:text-sm text-muted-foreground">
                        {member.email}
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">
                        {member.isOwner ? (
                          <Badge variant="default" className="rounded-full border-border bg-white text-gray-900 hover:bg-gray-50">
                            {t("admin")}
                          </Badge>
                        ) : (
                          <Badge variant={member.role === "admin" ? "default" : "secondary"} className={member.role === "admin" ? "rounded-full border-border bg-white text-gray-900 hover:bg-gray-50" : ""}>
                            {member.role === "admin" ? t("admin") : t("member")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">
                        {member.isOwner ? (
                          <Badge variant="secondary" className="rounded-full bg-primary text-primary-foreground border-transparent hover:bg-primary">{t("active")}</Badge>
                        ) : (
                          <InvitationStatus status={member.status} />
                        )}
                      </TableCell>
                      <TableCell className="text-xs md:text-sm text-muted-foreground">
                        {member.isOwner ? (
                          <span>{t("since")} {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "N/A"}</span>
                        ) : member.status === "pending" ? (
                          <span>{t("invited")} {member.invitedAt ? new Date(member.invitedAt).toLocaleDateString() : "N/A"}</span>
                        ) : member.acceptedAt ? (
                          <span>{t("joined")} {new Date(member.acceptedAt).toLocaleDateString()}</span>
                        ) : (
                          <span>-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!member.isOwner && (currentUserRole === "admin" || currentUserRole === "super_admin" || currentUserRole === null) && canWrite && (
                          <div className="flex space-x-1 md:space-x-2">
                            {member.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 md:h-10 md:w-10"
                                onClick={() => handleResend(member)}
                                title={t("resendInvitationEmail")}
                              >
                                <Mail className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 md:h-10 md:w-10"
                              onClick={() => handleEdit(member)}
                            >
                              <EditIcon className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 md:h-10 md:w-10"
                              onClick={() => handleDelete(member)}
                              disabled={deletingId === member.id}
                            >
                              {deletingId === member.id ? (
                                <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <MemberForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          member={editingMember}
          onSuccess={handleFormSuccess}
        />
        {ConfirmDialog}
      </div>
    </FeatureGuard>
  );
}

