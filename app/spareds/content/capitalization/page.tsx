'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CapitalizationPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Capitalization</h1>
        <p className="text-muted-foreground text-lg">
          Guidelines for text capitalization
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Title Case</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground mb-4">
            Use title case for:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground">
            <li>Page titles and headings</li>
            <li>Button labels (primary actions)</li>
            <li>Navigation items</li>
            <li>Card titles</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sentence Case</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground mb-4">
            Use sentence case for:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground">
            <li>Body text and descriptions</li>
            <li>Form labels</li>
            <li>Error messages</li>
            <li>Tooltips and help text</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

