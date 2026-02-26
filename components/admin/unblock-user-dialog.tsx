"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AdminUser } from "@/src/domain/admin/admin.types";

interface UnblockUserDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UnblockUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: UnblockUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  async function handleUnblock() {
    if (!user) return;

    if (!reason.trim()) {
      setError("Please provide a reason for unblocking this user");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/v2/admin/users/unblock", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          reason: reason.trim(),
          pauseSubscription: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to unblock user");
        setLoading(false);
        return;
      }

      onSuccess();
      onOpenChange(false);
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unblock user");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-[500px] w-full p-0 flex flex-col gap-0 overflow-hidden bg-background border-l"
      >
        <SheetHeader className="p-6 pb-4 border-b shrink-0">
          <SheetTitle className="text-xl flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-sentiment-positive" />
            Unblock User
          </SheetTitle>
          <SheetDescription>
            Unblock {user.name || user.email} to restore access to the system
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user">User</Label>
                <Input
                  id="user"
                  value={user.name || user.email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for unblocking *</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter the reason for unblocking this user..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be saved in the block history.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t flex flex-wrap justify-end gap-2 shrink-0 bg-background">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setReason("");
                setError(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnblock}
              disabled={loading || !reason.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unblock User
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

