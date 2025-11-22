'use client';

import React from 'react';
import { tokens } from '@/spareds/tokens';
import { TokenViewer } from '../../components/token-viewer';

export default function ComponentPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Component Tokens</h1>
        <p className="text-muted-foreground text-lg">
          Level 4: Component-specific tokens (button, card, input, etc.)
        </p>
      </div>

      <TokenViewer
        title="Component Tokens"
        description="Tokens applied to specific UI components"
        data={tokens.component}
        level={4}
      />
    </div>
  );
}

