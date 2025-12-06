import { PageHeader } from "@/components/common/page-header";

export default function FoundationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <PageHeader 
        title="Foundation" 
        description="Core design tokens and building blocks"
      />
        <div className="w-full">
          {children}
        </div>
    </div>
  );
}

