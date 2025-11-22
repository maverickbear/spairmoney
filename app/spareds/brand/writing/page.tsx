'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WritingGuidelinesPage() {
  const guidelines = [
    {
      title: 'Tone of Voice',
      description: 'Clear, friendly, and empowering. Avoid financial jargon when possible.',
    },
    {
      title: 'Clarity',
      description: 'Use simple, direct language. Be concise but complete.',
    },
    {
      title: 'User-Focused',
      description: 'Write from the user\'s perspective. Use "you" instead of "we".',
    },
    {
      title: 'Action-Oriented',
      description: 'Use active voice and clear calls to action.',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Writing Guidelines</h1>
        <p className="text-muted-foreground text-lg">
          Guidelines for writing and content creation
        </p>
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

