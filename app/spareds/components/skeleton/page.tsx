'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SkeletonPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Skeleton</h1>
        <p className="text-muted-foreground text-lg">
          Componente de skeleton para loading states
        </p>
      </div>

      {/* Basic Skeleton */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Skeleton Básico</h2>
        <Card>
          <CardHeader>
            <CardTitle>Exemplos</CardTitle>
            <CardDescription>Diferentes formas de skeleton</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
            <div className="bg-foreground text-background p-4 rounded-lg">
              <code className="text-sm whitespace-pre">
{`<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-12 w-12 rounded-full" />`}
              </code>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Card Skeleton */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Card Skeleton</h2>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

