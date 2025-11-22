'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { tokens } from '@/spareds/tokens';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export default function AlertsPage() {
  const alertTokens = tokens.component?.alert || {};

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Alerts</h1>
        <p className="text-muted-foreground text-lg">
          Alertas para feedback do usuário
        </p>
      </div>

      {/* Variants */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Variantes</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default</CardTitle>
              <CardDescription>Alerta padrão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                  This is a default alert with an info icon.
                </AlertDescription>
              </Alert>
              <div className="bg-foreground text-background p-4 rounded-lg">
                <code className="text-sm whitespace-pre">
{`<Alert>
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    Your message here
  </AlertDescription>
</Alert>`}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Destructive</CardTitle>
              <CardDescription>Alerta para erros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Something went wrong. Please try again.
                </AlertDescription>
              </Alert>
              <div className="bg-foreground text-background p-4 rounded-lg">
                <code className="text-sm whitespace-pre">
{`<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Your error message
  </AlertDescription>
</Alert>`}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Examples */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Exemplos</h2>
        <div className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Your changes have been saved successfully.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Please review your input before submitting.
            </AlertDescription>
          </Alert>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              This feature is currently in beta.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Tokens */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Tokens</h2>
        <Card>
          <CardHeader>
            <CardTitle>Component Tokens</CardTitle>
            <CardDescription>Tokens específicos para alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-foreground text-background p-4 rounded-lg overflow-x-auto text-sm">
              <code>{JSON.stringify(alertTokens, null, 2)}</code>
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

