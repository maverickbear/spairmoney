'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChangelogPage() {
  const changelog = [
    {
      version: '1.0.0',
      date: '2025-01-22',
      type: 'initial',
      changes: [
        'Initial release of Spare Design System',
        '4-level token hierarchy implementation',
        'Complete color system with semantic tokens',
        '13 UI components documented',
        'Public API endpoints',
        'Dark mode support',
      ],
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Change Log</h1>
        <p className="text-muted-foreground text-lg">
          Version history and updates to the Spare Design System
        </p>
      </div>

      <div className="space-y-6">
        {changelog.map((release) => (
          <Card key={release.version}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>v{release.version}</CardTitle>
                  <CardDescription>{release.date}</CardDescription>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                  {release.type === 'initial' ? 'Initial Release' : release.type}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                {release.changes.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

