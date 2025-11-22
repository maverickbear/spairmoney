'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { tokens } from '@/spareds/tokens';

export default function ButtonsPage() {
  const buttonTokens = tokens.component?.button || {};

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Buttons</h1>
        <p className="text-muted-foreground text-lg">
          Button component with different variants and sizes
        </p>
      </div>

      {/* Variants */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Default</CardTitle>
              <CardDescription>Default primary button</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="default" size="small">Small</Button>
                <Button variant="default" size="medium">Medium</Button>
                <Button variant="default" size="large">Large</Button>
              </div>
              <div className="bg-foreground text-background p-4 rounded-lg">
                <code className="text-sm">
                  {`<Button variant="default">Default</Button>`}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Secondary</CardTitle>
              <CardDescription>Secondary button</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary">Secondary</Button>
                <Button variant="secondary" size="small">Small</Button>
                <Button variant="secondary" size="medium">Medium</Button>
                <Button variant="secondary" size="large">Large</Button>
              </div>
              <div className="bg-foreground text-background p-4 rounded-lg">
                <code className="text-sm">
                  {`<Button variant="secondary">Secondary</Button>`}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Destructive</CardTitle>
              <CardDescription>Button for destructive actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="destructive">Destructive</Button>
                <Button variant="destructive" size="small">Small</Button>
                <Button variant="destructive" size="medium">Medium</Button>
                <Button variant="destructive" size="large">Large</Button>
              </div>
              <div className="bg-foreground text-background p-4 rounded-lg">
                <code className="text-sm">
                  {`<Button variant="destructive">Destructive</Button>`}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outline</CardTitle>
              <CardDescription>Button with border</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="outline">Outline</Button>
                <Button variant="outline" size="small">Small</Button>
                <Button variant="outline" size="medium">Medium</Button>
                <Button variant="outline" size="large">Large</Button>
              </div>
              <div className="bg-foreground text-background p-4 rounded-lg">
                <code className="text-sm">
                  {`<Button variant="outline">Outline</Button>`}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ghost</CardTitle>
              <CardDescription>Button without background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="ghost">Ghost</Button>
                <Button variant="ghost" size="small">Small</Button>
                <Button variant="ghost" size="medium">Medium</Button>
                <Button variant="ghost" size="large">Large</Button>
              </div>
              <div className="bg-foreground text-background p-4 rounded-lg">
                <code className="text-sm">
                  {`<Button variant="ghost">Ghost</Button>`}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Link</CardTitle>
              <CardDescription>Link style button</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="link">Link</Button>
                <Button variant="link" size="small">Small</Button>
                <Button variant="link" size="medium">Medium</Button>
                <Button variant="link" size="large">Large</Button>
              </div>
              <div className="bg-foreground text-background p-4 rounded-lg">
                <code className="text-sm">
                  {`<Button variant="link">Link</Button>`}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* States */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">States</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Button>Normal</Button>
              <Button disabled>Disabled</Button>
              <Button variant="outline" disabled>Disabled Outline</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tokens */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Tokens</h2>
        <Card>
          <CardHeader>
            <CardTitle>Component Tokens</CardTitle>
            <CardDescription>Specific tokens for buttons</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-foreground text-background p-4 rounded-lg overflow-x-auto text-sm">
              <code>{JSON.stringify(buttonTokens, null, 2)}</code>
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

