'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LogoPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Logo</h1>
        <p className="text-muted-foreground text-lg">
          Logo usage and guidelines
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Primary Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-[#4A4AF2] to-[#6D6DFF] flex items-center justify-center text-white text-4xl font-bold">
              S
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Primary logo with gradient background
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logo Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>Maintain minimum clear space around the logo</li>
              <li>Do not distort or rotate the logo</li>
              <li>Use approved color variations only</li>
              <li>Ensure sufficient contrast on backgrounds</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

