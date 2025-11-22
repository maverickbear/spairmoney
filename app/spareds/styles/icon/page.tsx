'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function IconPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Icon</h1>
        <p className="text-muted-foreground text-lg">
          Icon system and usage guidelines
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Icon Library</CardTitle>
          <CardDescription>
            We use Lucide React for our icon system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground mb-4">
            All icons are from the Lucide icon library, ensuring consistency and quality across the design system.
          </p>
          <div className="bg-foreground text-background p-4 rounded-lg">
            <code className="text-sm whitespace-pre">
{`import { IconName } from 'lucide-react';

<IconName className="w-4 h-4" />`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

