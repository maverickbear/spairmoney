'use client';

import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ProgressPage() {
  const [progress, setProgress] = useState(33);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (progress < 100) {
        setProgress(progress + 1);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Progress</h1>
        <p className="text-muted-foreground text-lg">
          Componente de barra de progresso
        </p>
      </div>

      {/* Basic Progress */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Progress Básico</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Static Progress</CardTitle>
              <CardDescription>Progress com valor fixo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={33} />
              <Progress value={66} />
              <Progress value={100} />
              <div className="bg-foreground text-background p-4 rounded-lg">
                <code className="text-sm">
                  {`<Progress value={33} />`}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Animated Progress</CardTitle>
              <CardDescription>Progress com animação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} />
              <Button
                size="small"
                onClick={() => setProgress(0)}
                className="w-full"
              >
                Reset
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

