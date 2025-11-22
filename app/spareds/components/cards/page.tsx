'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { tokens } from '@/spareds/tokens';

export default function CardsPage() {
  const cardTokens = tokens.component?.card || {};

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Cards</h1>
        <p className="text-muted-foreground text-lg">
          Card component for displaying grouped content
        </p>
      </div>

      {/* Basic Card */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Basic Card</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">Card content area</p>
            </CardContent>
            <CardFooter>
              <Button>Action</Button>
            </CardFooter>
          </Card>

          <div className="bg-foreground text-background p-4 rounded-lg">
            <code className="text-sm whitespace-pre">
{`<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>`}
            </code>
          </div>
        </div>
      </section>

      {/* Card Variants */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Simple Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                A simple card with just header and content
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Card with Footer</CardTitle>
              <CardDescription>With action buttons</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Content here</p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" size="small">Cancel</Button>
              <Button size="small">Confirm</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Full Card</CardTitle>
              <CardDescription>All sections included</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This card demonstrates all available sections
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="small">Learn More</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Tokens */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Tokens</h2>
        <Card>
          <CardHeader>
            <CardTitle>Component Tokens</CardTitle>
            <CardDescription>Specific tokens for cards</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-foreground text-background p-4 rounded-lg overflow-x-auto text-sm">
              <code>{JSON.stringify(cardTokens, null, 2)}</code>
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

