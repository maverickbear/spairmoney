'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccessibilityPage() {
  const guidelines = [
    {
      title: 'Color Contrast',
      description: 'All color combinations meet WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text).',
    },
    {
      title: 'Keyboard Navigation',
      description: 'All interactive components are fully keyboard accessible with clear focus indicators.',
    },
    {
      title: 'Screen Readers',
      description: 'Components include proper ARIA labels, roles, and semantic HTML for screen reader compatibility.',
    },
    {
      title: 'Focus Management',
      description: 'Clear focus indicators and logical tab order throughout all components.',
    },
    {
      title: 'Alternative Text',
      description: 'All images and icons include descriptive alt text or are marked as decorative.',
    },
    {
      title: 'Responsive Design',
      description: 'Components work across all screen sizes and devices, maintaining usability.',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Accessibility</h1>
        <p className="text-muted-foreground text-lg">
          Building inclusive experiences for everyone
        </p>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>WCAG 2.1 AA Compliance</CardTitle>
            <CardDescription>
              The Spare Design System is built with accessibility in mind, following WCAG 2.1 Level AA standards.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guidelines.map((guideline) => (
          <Card key={guideline.title}>
            <CardHeader>
              <CardTitle>{guideline.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {guideline.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

