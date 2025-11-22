'use client';

import React from 'react';
import { tokens } from '@/spareds/tokens';
import { TokenViewer } from '../../components/token-viewer';

export default function FoundationPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Foundation Tokens</h1>
        <p className="text-muted-foreground text-lg">
          Level 2: Fundamental primitive tokens organized in color scales
        </p>
      </div>

      <TokenViewer
        title="Foundation Tokens"
        description="Primitive color scales (Primary, Gray, Blue, Green, etc.)"
        data={tokens.foundation}
        level={2}
      />
    </div>
  );
}

