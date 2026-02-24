import { unstable_noStore } from "next/cache";
import { PageHeader } from "@/components/common/page-header";

export default function ComponentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  unstable_noStore();
  return (
    <div className="w-full">
      <PageHeader 
        title="Components" 
        description="UI components and patterns"
      />
        <div className="w-full">
          {children}
        </div>
    </div>
  );
}

