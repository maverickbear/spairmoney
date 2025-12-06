import { PageHeader } from "@/components/common/page-header";

export default function ComponentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

