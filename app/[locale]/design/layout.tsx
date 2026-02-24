import { ReactNode } from "react";
import { unstable_noStore } from "next/cache";
import { DesignSideNav } from "@/components/design/design-side-nav";

export default function DesignLayout({
  children,
}: {
  children: ReactNode;
}) {
  unstable_noStore();
  return (
    <div className="min-h-screen bg-background">
      <DesignSideNav />
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
