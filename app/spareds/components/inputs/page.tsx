'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { tokens } from '@/spareds/tokens';

export default function InputsPage() {
  const inputTokens = tokens.component?.input || {};

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Inputs</h1>
        <p className="text-muted-foreground text-lg">
          Data input fields with different sizes
        </p>
      </div>

      {/* Sizes */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Sizes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Small</CardTitle>
              <CardDescription>Small input</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input-small">Label</Label>
                <Input id="input-small" size="small" placeholder="Small input" />
              </div>
              <div className="bg-foreground text-background p-4 rounded-lg">
                <code className="text-sm">
                  {`<Input size="small" placeholder="..." />`}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medium</CardTitle>
              <CardDescription>Medium input (default)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input-medium">Label</Label>
                <Input id="input-medium" size="medium" placeholder="Medium input" />
              </div>
              <div className="bg-foreground text-background p-4 rounded-lg">
                <code className="text-sm">
                  {`<Input size="medium" placeholder="..." />`}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Large</CardTitle>
              <CardDescription>Large input</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input-large">Label</Label>
                <Input id="input-large" size="large" placeholder="Large input" />
              </div>
              <div className="bg-foreground text-background p-4 rounded-lg">
                <code className="text-sm">
                  {`<Input size="large" placeholder="..." />`}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estados</CardTitle>
              <CardDescription>Input in different states</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input-normal">Normal</Label>
                <Input id="input-normal" placeholder="Normal input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="input-disabled">Disabled</Label>
                <Input id="input-disabled" placeholder="Disabled input" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="input-error">Error (custom)</Label>
                <Input 
                  id="input-error" 
                  placeholder="Error input" 
                  className="border-destructive focus-visible:ring-destructive"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Types */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Types</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text-input">Text</Label>
              <Input id="text-input" type="text" placeholder="Text input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-input">Email</Label>
              <Input id="email-input" type="email" placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-input">Password</Label>
              <Input id="password-input" type="password" placeholder="Password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number-input">Number</Label>
              <Input id="number-input" type="number" placeholder="123" />
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
            <CardDescription>Specific tokens for inputs</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-foreground text-background p-4 rounded-lg overflow-x-auto text-sm">
              <code>{JSON.stringify(inputTokens, null, 2)}</code>
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

