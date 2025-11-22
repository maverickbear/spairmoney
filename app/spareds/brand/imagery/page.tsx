'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ImageryPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Imagery</h1>
        <p className="text-muted-foreground text-lg">
          Guidelines for using images and illustrations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Image Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-foreground">
            <li>Use high-quality, professional images</li>
            <li>Ensure images are relevant to the content</li>
            <li>Maintain consistent style across all imagery</li>
            <li>Include proper alt text for accessibility</li>
            <li>Optimize images for web performance</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

