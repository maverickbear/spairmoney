'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ColourPage() {
  const colorCategories = [
    {
      title: 'Primary Colors',
      description: 'Brand primary color palette',
      href: '/spareds/colors/primary',
    },
    {
      title: 'Semantic Colors',
      description: 'Colors with semantic meaning',
      href: '/spareds/colors/semantic',
    },
    {
      title: 'Gray Scale',
      description: 'Neutral color scale',
      href: '/spareds/colors/gray',
    },
    {
      title: 'Category Colors',
      description: 'Colors for transaction categories',
      href: '/spareds/colors/categories',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Colour</h1>
        <p className="text-muted-foreground text-lg">
          Complete color system with semantic tokens and usage guidelines
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {colorCategories.map((category) => (
          <Link key={category.title} href={category.href}>
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle>{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Color Token Hierarchy</CardTitle>
          <CardDescription>
            Colors are organized in a 4-level hierarchy for maximum flexibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 text-foreground">Level 1: Default Values</h3>
              <p className="text-sm text-muted-foreground">
                Raw hexadecimal color codes (e.g., #4A4AF2)
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-foreground">Level 2: Foundation Tokens</h3>
              <p className="text-sm text-muted-foreground">
                Primitive color scales organized by color family (Primary, Gray, Blue, etc.)
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-foreground">Level 3: Semantic Tokens</h3>
              <p className="text-sm text-muted-foreground">
                Purpose-driven colors (text, background, border, success, error, etc.)
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-foreground">Level 4: Component Tokens</h3>
              <p className="text-sm text-muted-foreground">
                Component-specific color tokens (button-primary-bg, card-border, etc.)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

