'use client';

import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CheckboxPage() {
  const [checked, setChecked] = useState(false);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Checkbox</h1>
        <p className="text-muted-foreground text-lg">
          Componente de checkbox para seleção
        </p>
      </div>

      {/* Basic Checkbox */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Checkbox Básico</h2>
        <Card>
          <CardHeader>
            <CardTitle>Exemplo</CardTitle>
            <CardDescription>Checkbox com label</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={checked}
                onCheckedChange={setChecked}
              />
              <Label htmlFor="terms" className="cursor-pointer">
                Accept terms and conditions
              </Label>
            </div>
            <div className="bg-foreground text-background p-4 rounded-lg">
              <code className="text-sm whitespace-pre">
{`<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms</Label>
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
              <Checkbox id="unchecked" />
              <Label htmlFor="unchecked">Unchecked</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="checked" defaultChecked />
              <Label htmlFor="checked">Checked</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="disabled" disabled />
              <Label htmlFor="disabled" className="text-muted-foreground">Disabled</Label>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

