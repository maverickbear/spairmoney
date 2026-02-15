"use client";

import { usePagePerformance } from "@/hooks/use-page-performance";
import { useEffect, useState } from "react";
import { HouseholdModule } from "@/src/presentation/components/features/household/household-module";
import { PageHeader } from "@/components/common/page-header";
import { MobileAddBar } from "@/components/common/mobile-add-bar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useWriteGuard } from "@/hooks/use-write-guard";
import { useAuthSafe } from "@/contexts/auth-context";

export default function HouseholdPage() {
  const perf = usePagePerformance("Settings - Household");
  const { checkWriteAccess, canWrite } = useWriteGuard();
  const { role: currentUserRole } = useAuthSafe();
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      perf.markComplete();
    }, 100);
    return () => clearTimeout(timer);
  }, [perf]);

  const showInviteBar =
    (currentUserRole === "admin" || currentUserRole === "super_admin" || currentUserRole === null) &&
    canWrite;

  return (
    <div>
      <PageHeader title="Household" />

      <div className="w-full p-4 lg:p-8 pb-32 lg:pb-8">
        <HouseholdModule
          externalInviteOpen={inviteOpen}
          onExternalInviteOpenChange={setInviteOpen}
        />
      </div>

      {showInviteBar && (
        <MobileAddBar>
          <Button
            size="mobileAdd"
            onClick={() => {
              if (!checkWriteAccess()) return;
              setInviteOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </MobileAddBar>
      )}
    </div>
  );
}

