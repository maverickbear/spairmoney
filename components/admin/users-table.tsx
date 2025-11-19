"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users as UsersIcon } from "lucide-react";
import type { AdminUser } from "@/lib/api/admin";

interface UsersTableProps {
  users: AdminUser[];
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function UsersTable({ users: initialUsers, loading: initialLoading, searchQuery: externalSearchQuery, onSearchChange }: UsersTableProps) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [loading, setLoading] = useState(initialLoading);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  
  // Use external search query if provided, otherwise use internal state
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchChange || setInternalSearchQuery;

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    setLoading(initialLoading);
  }, [initialLoading]);

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      (user.name && user.name.toLowerCase().includes(query)) ||
      (user.plan && user.plan.name.toLowerCase().includes(query))
    );
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trialing: "secondary",
      cancelled: "destructive",
      past_due: "destructive",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden lg:block rounded-[12px] border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Household</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <div className="flex items-center justify-center min-h-[400px] w-full">
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                      <UsersIcon className="h-8 w-8" />
                      <p>No users found</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{user.name || "-"}</span>
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.plan ? (
                      <Badge variant="outline">{user.plan.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">No plan</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.subscription
                      ? getStatusBadge(user.subscription.status)
                      : <span className="text-muted-foreground">No subscription</span>}
                  </TableCell>
                  <TableCell>
                    {user.household.hasHousehold ? (
                      <Badge variant="secondary" className="w-fit">
                        {user.household.isOwner ? "Owner" : "Member"}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

