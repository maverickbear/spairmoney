'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const categoryColors = {
  blue: '#3b82f6',
  green: '#10b981',
  emerald: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  orange: '#f97316',
  pink: '#ec4899',
  teal: '#14b8a6',
  indigo: '#6366f1',
  violet: '#a855f7',
  lime: '#84cc16',
  rose: '#f43f5e',
  sky: '#0ea5e9',
  yellow: '#eab308',
  gray: '#6b7280',
};

export default function CategoryColorsPage() {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (color: string, name: string) => {
    navigator.clipboard.writeText(color);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Category Colors</h1>
        <p className="text-muted-foreground text-lg">
          Specific colors for categorizing transactions and financial data
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Category Palette</CardTitle>
          <CardDescription>
            Colors used to identify different transaction categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(categoryColors).map(([name, color]) => (
              <div
                key={name}
                className="border border-border rounded-lg overflow-hidden bg-card"
              >
                <div
                  className="w-full h-24"
                  style={{ backgroundColor: color }}
                />
                <div className="p-3">
                  <div className="font-semibold text-sm mb-1 text-foreground capitalize">
                    {name}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">
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
getToken('color.category.blue')
getToken('color.category.green')
getToken('color.category.emerald')

// Função helper
import { getCategoryColor } from '@/lib/utils/category-colors';
const color = getCategoryColor('Groceries');`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

