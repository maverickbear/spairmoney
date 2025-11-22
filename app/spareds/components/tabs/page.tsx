'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TabsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Tabs</h1>
        <p className="text-muted-foreground text-lg">
          Componente de abas para organizar conteúdo
        </p>
      </div>

      {/* Basic Tabs */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Tabs Básico</h2>
        <Card>
          <CardHeader>
            <CardTitle>Exemplo</CardTitle>
            <CardDescription>Tabs com múltiplas abas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="account" className="w-full">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="account">
                <div className="p-4 bg-card border border-border rounded-lg">
                  <p className="text-foreground">Account content goes here.</p>
                </div>
              </TabsContent>
              <TabsContent value="password">
                <div className="p-4 bg-card border border-border rounded-lg">
                  <p className="text-foreground">Password content goes here.</p>
                </div>
              </TabsContent>
              <TabsContent value="settings">
                <div className="p-4 bg-card border border-border rounded-lg">
                  <p className="text-foreground">Settings content goes here.</p>
                </div>
              </TabsContent>
            </Tabs>
            <div className="bg-foreground text-background p-4 rounded-lg">
              <code className="text-sm whitespace-pre">
{`<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    Content here
  </TabsContent>
</Tabs>`}
              </code>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

