'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DesignPrinciplesPage() {
  const principles = [
    {
      title: 'Semantic First',
      description: 'Tokens organized by purpose, not by value. Every token has a clear semantic meaning.',
      icon: '🎯',
    },
    {
      title: 'Hierarchical Structure',
      description: '4 levels of abstraction (Default → Foundation → Semantic → Component) for maximum flexibility.',
      icon: '📐',
    },
    {
      title: 'Consistency',
      description: 'Unified design language across all products and platforms.',
      icon: '🔄',
    },
    {
      title: 'Accessibility',
      description: 'Built with WCAG 2.1 AA standards in mind. All components are keyboard navigable and screen reader friendly.',
      icon: '♿',
    },
    {
      title: 'Scalability',
      description: 'Design system grows with your product. Easy to extend and maintain.',
      icon: '📈',
    },
    {
      title: 'Developer Experience',
      description: 'Clear documentation, TypeScript support, and easy-to-use APIs.',
      icon: '👨‍💻',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Design Principles</h1>
        <p className="text-muted-foreground text-lg">
          The foundational principles that guide the Spare Design System
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {principles.map((principle) => (
          <Card key={principle.title}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{principle.icon}</span>
                <CardTitle>{principle.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {principle.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

