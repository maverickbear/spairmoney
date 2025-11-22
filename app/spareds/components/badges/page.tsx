'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { tokens } from '@/spareds/tokens';

export default function BadgesPage() {
  const badgeTokens = tokens.component?.badge || {};

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Badges</h1>
        <p className="text-muted-foreground text-lg">
          Badges para categorização e status
        </p>
      </div>

      {/* Variants */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Variantes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Default</CardTitle>
              <CardDescription>Badge padrão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="default" size="small">Small</Badge>
                <Badge variant="default" size="medium">Medium</Badge>
                <Badge variant="default" size="large">Large</Badge>
              </div>
              <div className="bg-foreground text-background p-4 rounded-lg">
                <code className="text-sm">
                  {`<Badge variant="default">Default</Badge>`}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Secondary</CardTitle>
              <CardDescription>Badge secundário</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="secondary" size="small">Small</Badge>
                <Badge variant="secondary" size="medium">Medium</Badge>
                <Badge variant="secondary" size="large">Large</Badge>
              </div>
              <div className="bg-foreground text-background p-4 rounded-lg">
                <code className="text-sm">
                  {`<Badge variant="secondary">Secondary</Badge>`}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Destructive</CardTitle>
              <CardDescription>Badge para erros/alertas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="destructive" size="small">Small</Badge>
                <Badge variant="destructive" size="medium">Medium</Badge>
                <Badge variant="destructive" size="large">Large</Badge>
              </div>
              <div className="bg-foreground text-background p-4 rounded-lg">
                <code className="text-sm">
                  {`<Badge variant="destructive">Destructive</Badge>`}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outline</CardTitle>
              <CardDescription>Badge com borda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline">Outline</Badge>
                <Badge variant="outline" size="small">Small</Badge>
                <Badge variant="outline" size="medium">Medium</Badge>
                <Badge variant="outline" size="large">Large</Badge>
              </div>
              <div className="bg-foreground text-background p-4 rounded-lg">
                <code className="text-sm">
                  {`<Badge variant="outline">Outline</Badge>`}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Usage Examples */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Exemplos de Uso</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-foreground">Status:</span>
              <Badge variant="default">Active</Badge>
              <Badge variant="secondary">Pending</Badge>
              <Badge variant="destructive">Error</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground">Tags:</span>
              <Badge variant="outline">React</Badge>
              <Badge variant="outline">TypeScript</Badge>
              <Badge variant="outline">Next.js</Badge>
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
            <CardDescription>Tokens específicos para badges</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-foreground text-background p-4 rounded-lg overflow-x-auto text-sm">
              <code>{JSON.stringify(badgeTokens, null, 2)}</code>
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

