'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DateTimePage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Date & Time</h1>
        <p className="text-muted-foreground text-lg">
          Formatting guidelines for dates and times
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Date Format</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-2">Use ISO 8601 format (YYYY-MM-DD) for data storage.</p>
            <p className="text-foreground mb-2">Display format: "January 22, 2025" or "Jan 22, 2025"</p>
            <code className="text-sm bg-muted px-2 py-1 rounded">2025-01-22</code>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Format</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-2">Use 12-hour format with AM/PM for user-facing displays.</p>
            <p className="text-foreground mb-2">Example: "2:30 PM" or "10:15 AM"</p>
            <code className="text-sm bg-muted px-2 py-1 rounded">2:30 PM</code>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

