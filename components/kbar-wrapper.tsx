"use client";

import { useState } from "react";
import { KBar } from "@/components/common/kbar";

export function KBarWrapper() {
  const [open, setOpen] = useState(false);

  return <KBar open={open} onOpenChange={setOpen} />;
}

