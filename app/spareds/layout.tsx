import React from 'react';
import { Sidebar } from './components/sidebar';

export default function SpareDSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
        {children}
      </main>
    </div>
  );
}

