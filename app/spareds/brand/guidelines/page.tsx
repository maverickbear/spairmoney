'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BrandGuidelinesPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Brand Guidelines</h1>
        <p className="text-muted-foreground text-lg">
          Guidelines for using the Spare Finance brand
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Brand Identity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-4">
              Spare Finance represents financial empowerment and smart money management. 
              Our brand should always convey trust, clarity, and innovation.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand Values</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>Transparency - Clear and honest communication</li>
              <li>Empowerment - Helping users take control of their finances</li>
              <li>Innovation - Using technology to simplify financial management</li>
              <li>Trust - Building reliable and secure financial tools</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

