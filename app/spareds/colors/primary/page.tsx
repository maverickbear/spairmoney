'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const primaryColors = {
  900: '#16161B',
  800: '#16161B',
  700: '#16161B',
  600: '#7BC85A',
  500: '#94DD78',
  400: '#B0E89A',
  300: '#C5F0B0',
};

export default function PrimaryColorsPage() {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (color: string, name: string) => {
    navigator.clipboard.writeText(color);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Primary Colors</h1>
        <p className="text-muted-foreground text-lg">
          Primary color palette for Spare Finance brand
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Primary Color Scale</CardTitle>
          <CardDescription>
            From darkest (900) to lightest (300)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(primaryColors).map(([name, color]) => (
              <div
                key={name}
                className="border border-border rounded-lg overflow-hidden bg-card"
              >
                <div
                  className="w-full h-32"
                  style={{ backgroundColor: color }}
                />
                <div className="p-4">
                  <div className="font-semibold mb-1 text-foreground">{name}</div>
                  <div className="text-sm font-mono text-muted-foreground mb-2">
                    {color}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="small"
                    onClick={() => copyToClipboard(color, name)}
                    className="text-xs text-primary"
                  >
                    {copied === name ? '✓ Copied' : '📋 Copy'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-foreground text-background p-4 rounded-lg">
            <code className="text-sm whitespace-pre">
{`// Token
getToken('color.primary.500')

// CSS Variable
var(--primary)

// Tailwind
bg-primary text-primary-foreground`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

