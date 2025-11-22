'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TruncatingTextPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Truncating Text</h1>
        <p className="text-muted-foreground text-lg">
          Guidelines for handling long text
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Text Truncation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-foreground mb-2">Use ellipsis (...) for truncated text:</p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="truncate w-48">
                  This is a very long text that will be truncated with an ellipsis
                </p>
              </div>
            </div>
            <div>
              <p className="text-foreground mb-2">For multi-line truncation, use line-clamp:</p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="line-clamp-2">
                  This is a longer text that will be truncated after two lines. It demonstrates how to handle longer content that needs to be limited in display.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

