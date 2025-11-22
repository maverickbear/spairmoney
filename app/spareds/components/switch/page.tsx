'use client';

import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SwitchPage() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Switch</h1>
        <p className="text-muted-foreground text-lg">
          Componente de switch para alternar estados
        </p>
      </div>

      {/* Basic Switch */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Switch Básico</h2>
        <Card>
          <CardHeader>
            <CardTitle>Exemplo</CardTitle>
            <CardDescription>Switch com label</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="airplane-mode"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
              <Label htmlFor="airplane-mode" className="cursor-pointer">
                Airplane Mode
              </Label>
            </div>
            <div className="bg-foreground text-background p-4 rounded-lg">
              <code className="text-sm whitespace-pre">
{`<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>`}
              </code>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* States */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Estados</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Switch id="off" />
              <Label htmlFor="off">Off</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="on" defaultChecked />
              <Label htmlFor="on">On</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="disabled" disabled />
              <Label htmlFor="disabled" className="text-muted-foreground">Disabled</Label>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

