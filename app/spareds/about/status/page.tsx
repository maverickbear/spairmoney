'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function StatusTablePage() {
  const components = [
    { name: 'Button', status: 'stable', version: '1.0.0' },
    { name: 'Card', status: 'stable', version: '1.0.0' },
    { name: 'Input', status: 'stable', version: '1.0.0' },
    { name: 'Badge', status: 'stable', version: '1.0.0' },
    { name: 'Alert', status: 'stable', version: '1.0.0' },
    { name: 'Dialog', status: 'stable', version: '1.0.0' },
    { name: 'Tabs', status: 'stable', version: '1.0.0' },
    { name: 'Select', status: 'stable', version: '1.0.0' },
    { name: 'Checkbox', status: 'stable', version: '1.0.0' },
    { name: 'Switch', status: 'stable', version: '1.0.0' },
    { name: 'Tooltip', status: 'stable', version: '1.0.0' },
    { name: 'Progress', status: 'stable', version: '1.0.0' },
    { name: 'Skeleton', status: 'stable', version: '1.0.0' },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      stable: 'default',
      beta: 'secondary',
      deprecated: 'destructive',
      experimental: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Status Table</h1>
        <p className="text-muted-foreground text-lg">
          Component status and version information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Component Status</CardTitle>
          <CardDescription>
            Current status and version of all components in the design system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Version</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((component) => (
                <TableRow key={component.name}>
                  <TableCell className="font-medium">{component.name}</TableCell>
                  <TableCell>{getStatusBadge(component.status)}</TableCell>
                  <TableCell>{component.version}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stable</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Production-ready components that are fully tested and documented.
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Beta</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Components in testing phase. API may change before stable release.
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Experimental</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Early stage components. Use with caution, API will likely change.
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deprecated</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Components that will be removed in a future version. Migrate to alternatives.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

