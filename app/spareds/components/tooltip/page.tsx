'use client';

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TooltipPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Tooltip</h1>
        <p className="text-muted-foreground text-lg">
          Tooltips para informações adicionais
        </p>
      </div>

      {/* Basic Tooltip */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Tooltip Básico</h2>
        <Card>
          <CardHeader>
            <CardTitle>Exemplo</CardTitle>
            <CardDescription>Tooltip em diferentes posições</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover me (Top)</Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Tooltip on top</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover me (Bottom)</Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Tooltip on bottom</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover me (Left)</Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Tooltip on left</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover me (Right)</Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Tooltip on right</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="bg-foreground text-background p-4 rounded-lg">
              <code className="text-sm whitespace-pre">
{`<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button>Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Tooltip content</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`}
              </code>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

