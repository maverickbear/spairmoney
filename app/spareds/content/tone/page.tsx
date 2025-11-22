'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ToneOfVoicePage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Tone of Voice</h1>
        <p className="text-muted-foreground text-lg">
          How we communicate with our users
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Friendly</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Approachable and warm, but always professional. We're here to help, not intimidate.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clear</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Simple, direct language. Avoid jargon and explain complex financial concepts in plain terms.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Empowering</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Help users feel in control of their finances. Use positive, action-oriented language.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trustworthy</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Honest and transparent. Never make promises we can't keep. Be upfront about limitations.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

