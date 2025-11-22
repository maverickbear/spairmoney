'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TypographyPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Typography</h1>
        <p className="text-muted-foreground text-lg">
          Type scale and font usage guidelines
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Type Scale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-foreground">Heading 1</h1>
              <p className="text-sm text-muted-foreground">text-4xl font-bold</p>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2 text-foreground">Heading 2</h2>
              <p className="text-sm text-muted-foreground">text-3xl font-bold</p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-foreground">Heading 3</h3>
              <p className="text-sm text-muted-foreground">text-2xl font-semibold</p>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-2 text-foreground">Heading 4</h4>
              <p className="text-sm text-muted-foreground">text-xl font-semibold</p>
            </div>
            <div>
              <p className="text-base mb-2 text-foreground">Body text - Regular paragraph text</p>
              <p className="text-sm text-muted-foreground">text-base</p>
            </div>
            <div>
              <p className="text-sm mb-2 text-foreground">Small text - Used for captions and labels</p>
              <p className="text-sm text-muted-foreground">text-sm</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

