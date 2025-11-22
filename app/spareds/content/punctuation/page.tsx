'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PunctuationPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Punctuation</h1>
        <p className="text-muted-foreground text-lg">
          Punctuation guidelines for consistent writing
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Periods</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">
              Use periods at the end of complete sentences. Omit periods in:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground mt-2">
              <li>Button labels</li>
              <li>Navigation items</li>
              <li>Single-word labels</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">
              Use commas to separate items in lists and to improve readability in longer sentences.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

