'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const grayScale = {
  50: '#f5f5f7',
  100: '#d1d5db',
  200: '#9ca3af',
  300: '#6b7280',
  400: '#374151',
  500: '#1d1d1f',
};

export default function GrayScalePage() {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (color: string, name: string) => {
    navigator.clipboard.writeText(color);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Gray Scale</h1>
        <p className="text-muted-foreground text-lg">
          Neutral scale for text, backgrounds and borders
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Complete Scale</CardTitle>
          <CardDescription>
            From lightest (50) to darkest (500)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(grayScale).map(([name, color]) => (
              <div
                key={name}
                className="border border-border rounded-lg overflow-hidden bg-card"
              >
                <div
                  className="w-full h-32 border-b border-border"
                  style={{ backgroundColor: color }}
                />
                <div className="p-4">
                  <div className="font-semibold mb-1 text-foreground">{name}</div>
                  <div className="text-sm font-mono text-muted-foreground mb-2">
                    {color}
                  </div>
                  <button
                    onClick={() => copyToClipboard(color, name)}
                    className="text-xs text-primary hover:underline"
                  >
                    {copied === name ? '✓ Copied' : '📋 Copy'}
                  </button>
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
getToken('color.gray.500')
getToken('color.text.primary')
getToken('color.bg.primary')`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

