'use client';

import React from 'react';
import { tokens } from '@/spareds/tokens';
import { TokenViewer } from '../../components/token-viewer';

export default function SemanticPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Semantic Tokens</h1>
        <p className="text-muted-foreground text-lg">
          Level 3: Tokens with semantic purpose (text, background, border, etc.)
        </p>
      </div>

      <TokenViewer
        title="Semantic Tokens"
        description="Tokens organized by purpose: semantic colors, text, background, borders, inputs, cards, etc."
        data={tokens.semantic}
        level={3}
      />
    </div>
  );
}

