'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CurrencyPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Currency</h1>
        <p className="text-muted-foreground text-lg">
          Currency formatting guidelines
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Currency Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-foreground mb-2">Use locale-aware formatting:</p>
              <code className="text-sm bg-muted px-2 py-1 rounded">$1,234.56</code>
            </div>
            <div>
              <p className="text-foreground mb-2">For negative amounts:</p>
              <code className="text-sm bg-muted px-2 py-1 rounded">-$123.45</code>
            </div>
            <div>
              <p className="text-foreground mb-2">Always show two decimal places for currency:</p>
              <code className="text-sm bg-muted px-2 py-1 rounded">$100.00</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

