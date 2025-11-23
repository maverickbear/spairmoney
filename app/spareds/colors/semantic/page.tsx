'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const semanticColors = {
  primary: '#4A4AF2',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

export default function SemanticColorsPage() {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (color: string, name: string) => {
    navigator.clipboard.writeText(color);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Semantic Colors</h1>
        <p className="text-muted-foreground text-lg">
          Colors with semantic meaning for states and feedback
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Object.entries(semanticColors).map(([name, color]) => (
          <Card key={name}>
            <CardHeader>
              <CardTitle className="capitalize">{name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="w-full h-24 rounded-lg"
                style={{ backgroundColor: color }}
              />
              <div className="space-y-2">
                <div className="text-sm font-mono text-muted-foreground">
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
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-foreground text-background p-4 rounded-lg">
            <code className="text-sm whitespace-pre">
{`// Token
getToken('color.semantic.success')
getToken('color.semantic.error')
getToken('color.semantic.warning')
getToken('color.semantic.info')`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

