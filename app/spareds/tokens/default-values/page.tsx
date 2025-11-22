'use client';

import React from 'react';
import { defaultValuesTokens } from '@/spareds/tokens';
import { TokenViewer } from '../../components/token-viewer';

export default function DefaultValuesPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Default Values</h1>
        <p className="text-muted-foreground text-lg">
          Level 1: Raw values (hex, pixels, etc.) - The foundation of all tokens
        </p>
      </div>

      <TokenViewer
        title="Default Values"
        description="Hexadecimal and primitive values used throughout the system"
        data={defaultValuesTokens}
        level={1}
      />
    </div>
  );
}

