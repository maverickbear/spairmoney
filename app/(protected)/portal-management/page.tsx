"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PortalManagementPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.replace("/portal-management/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
