'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ShadowPage() {
  const shadows = [
    { name: 'sm', value: '0 1px 2px 0 rgb(0 0 0 / 0.05)', usage: 'Small elevation' },
    { name: 'default', value: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', usage: 'Default elevation' },
    { name: 'md', value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', usage: 'Medium elevation' },
    { name: 'lg', value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', usage: 'Large elevation' },
    { name: 'xl', value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', usage: 'Extra large elevation' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Shadow</h1>
        <p className="text-muted-foreground text-lg">
          Elevation and depth through shadows
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shadows.map((shadow) => (
          <Card key={shadow.name}>
            <CardHeader>
              <CardTitle className="capitalize">{shadow.name}</CardTitle>
              <CardDescription>{shadow.usage}</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="w-full h-32 rounded-lg bg-card border border-border"
                style={{ boxShadow: shadow.value }}
              />
              <div className="mt-4">
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-foreground">
                  {shadow.value}
                </code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

