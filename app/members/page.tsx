"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users, Edit, Trash2, Crown, Mail } from "lucide-react";
import { MemberForm } from "@/components/members/member-form";
import { HouseholdMember } from "@/lib/api/members";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InvitationStatus } from "@/components/members/invitation-status";

function getInitials(name: string | null | undefined): string {
  if (!name) return "M";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name[0].toUpperCase();
}

export default function MembersPage() {
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<HouseholdMember | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<"admin" | "member" | null>(null);

  useEffect(() => {
    loadMembers();
    loadCurrentUserRole();
  }, []);

  async function loadCurrentUserRole() {
    try {
      const res = await fetch("/api/members/role");
      if (res.ok) {
        const data = await res.json();
        setCurrentUserRole(data.role);
      }
    } catch (error) {
      console.error("Error loading user role:", error);
    }
  }

  async function loadMembers() {
    try {
      setLoading(true);
      const res = await fetch("/api/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(member: HouseholdMember) {
    if (!confirm(`Are you sure you want to remove ${member.name || member.email} from your household?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to remove member");
      }

      loadMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      alert(error instanceof Error ? error.message : "Failed to remove member");
    }
  }

  async function handleResend(member: HouseholdMember) {
    try {
      const res = await fetch(`/api/members/${member.id}/resend`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to resend invitation");
      }

      alert("Invitation email resent successfully!");
    } catch (error) {
      console.error("Error resending invitation:", error);
      alert(error instanceof Error ? error.message : "Failed to resend invitation");
    }
  }

  function handleEdit(member: HouseholdMember) {
    setEditingMember(member);
    setIsFormOpen(true);
  }

  function handleFormClose() {
    setIsFormOpen(false);
    setEditingMember(undefined);
  }

  function handleFormSuccess() {
    loadMembers();
    handleFormClose();
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Household Members</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage household members and invitations
          </p>
        </div>
        {(currentUserRole === "admin" || currentUserRole === null) && (
          <Button
            size="sm"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Members Table */}
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No members yet</CardTitle>
            <CardDescription className="text-center mb-4">
              Invite household members to share access to your financial data.
            </CardDescription>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Invite Your First Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold border-2">
                            {getInitials(member.name)}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.name || member.email}</span>
                            {member.isOwner && (
                              <Badge variant="default" className="flex items-center gap-1">
                                <Crown className="h-3 w-3" />
                                Owner
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{member.email}</span>
                    </TableCell>
                    <TableCell>
                      {member.isOwner ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                          {member.role === "admin" ? "Admin" : "Member"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.isOwner ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <InvitationStatus status={member.status} />
                      )}
                    </TableCell>
                    <TableCell>
                      {member.isOwner ? (
                        <span className="text-sm text-muted-foreground">
                          Since {new Date(member.createdAt).toLocaleDateString()}
                        </span>
                      ) : member.status === "pending" ? (
                        <span className="text-sm text-muted-foreground">
                          Invited {new Date(member.invitedAt).toLocaleDateString()}
                        </span>
                      ) : member.acceptedAt ? (
                        <span className="text-sm text-muted-foreground">
                          Joined {new Date(member.acceptedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!member.isOwner && (currentUserRole === "admin" || currentUserRole === null) && (
                        <div className="flex justify-end gap-2">
                          {member.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResend(member)}
                              title="Resend invitation email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(member)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <MemberForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        member={editingMember}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}



