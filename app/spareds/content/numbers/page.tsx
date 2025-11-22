'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NumberFormattingPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Number Formatting</h1>
        <p className="text-muted-foreground text-lg">
          Guidelines for formatting numbers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Large Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-2">Use comma separators for thousands:</p>
            <code className="text-sm bg-muted px-2 py-1 rounded">1,234,567</code>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decimals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-2">Show appropriate decimal places based on context:</p>
            <code className="text-sm bg-muted px-2 py-1 rounded">123.45</code>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

