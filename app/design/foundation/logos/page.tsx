'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LogoItem {
  name: string;
  path: string;
  description: string;
  format: 'SVG' | 'PNG';
  size?: string;
}

const logoCategories: {
  icons: {
    title: string;
    description: string;
    items: LogoItem[];
  };
  fullLogos: {
    title: string;
    description: string;
    items: LogoItem[];
  };
} = {
  icons: {
    title: 'Icons (Icon Only)',
    description: 'Icon-only versions of the logo for use in small spaces, favicons, and app icons',
    items: [
      {
        name: 'Logomark Primary (SVG)',
        path: '/assets/logos/logomark-primary.svg',
        description: 'Primary green icon for light backgrounds',
        format: 'SVG' as const,
      },
      {
        name: 'Logomark Mono Light (SVG)',
        path: '/assets/logos/logomark-mono-light.svg',
        description: 'White icon for dark backgrounds',
        format: 'SVG' as const,
      },
      {
        name: 'Logomark Mono Dark (SVG)',
        path: '/assets/logos/logomark-mono-dark.svg',
        description: 'Dark icon for light backgrounds',
        format: 'SVG' as const,
      },
    ],
  },
  fullLogos: {
    title: 'Full Logos (Icon + Text)',
    description: 'Complete logos with icon and text for headers, footers, and marketing materials',
    items: [
      {
        name: 'Logo Primary Light Background (SVG)',
        path: '/assets/logos/logo-primary-lightbg.svg',
        description: 'Full logo with black text for light backgrounds',
        format: 'SVG' as const,
      },
      {
        name: 'Logo Primary Dark Background (SVG)',
        path: '/assets/logos/logo-primary-darkbg.svg',
        description: 'Full logo with white text for dark backgrounds',
        format: 'SVG' as const,
      },
      {
        name: 'Logo Mono Light (SVG)',
        path: '/assets/logos/logo-mono-light.svg',
        description: 'Monochrome full logo for light backgrounds',
        format: 'SVG' as const,
      },
      {
        name: 'Logo Mono Dark (SVG)',
        path: '/assets/logos/logo-mono-dark.svg',
        description: 'Monochrome full logo for dark backgrounds',
        format: 'SVG' as const,
      },
    ],
  },
};

function LogoCard({ item, bgClass }: { item: LogoItem; bgClass?: string }) {
  const isDarkBg = bgClass?.includes('bg-foreground') || bgClass?.includes('bg-black');
  
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{item.name}</CardTitle>
            <CardDescription className="mt-1">{item.description}</CardDescription>
          </div>
          <div className="text-xs text-muted-foreground ml-4">
            {item.format}
            {item.size && ` • ${item.size}`}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`${bgClass || 'bg-muted'} p-8 rounded-lg flex items-center justify-center min-h-[200px]`}>
          <div className="relative w-full max-w-[300px] aspect-video flex items-center justify-center">
            <Image
              src={item.path}
              alt={item.name}
              width={300}
              height={100}
              className="object-contain max-w-full max-h-full"
              unoptimized={item.path.endsWith('.svg')}
            />
          </div>
        </div>
        <div className="mt-4">
          <code className="text-xs bg-muted px-2 py-1 rounded break-all">
            {item.path}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LogosPage() {
  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {Object.entries(logoCategories).map(([key, category]) => (
          <div key={key} className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">{category.title}</h2>
              <p className="text-muted-foreground">{category.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.items.map((item, index) => {
                // Alternate background colors for better visibility
                const bgClass = index % 3 === 0 
                  ? 'bg-muted' 
                  : index % 3 === 1 
                  ? 'bg-foreground' 
                  : 'bg-background border border-border';
                
                return (
                  <LogoCard 
                    key={item.path} 
                    item={item} 
                    bgClass={bgClass}
                  />
                );
              })}
            </div>
          </div>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Usage Guidelines</CardTitle>
            <CardDescription>
              Best practices for using Spare Finance logos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p><strong className="text-foreground">Clear Space:</strong> Maintain minimum clear space around the logo equal to the height of the icon</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p><strong className="text-foreground">Color Selection:</strong> Use black/white logos on light backgrounds, white/dark-mode logos on dark backgrounds</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p><strong className="text-foreground">Format:</strong> Prefer SVG for web use, PNG for email templates and when transparency is needed</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p><strong className="text-foreground">Do Not:</strong> Distort, rotate, or modify the logo. Maintain aspect ratio and original colors</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p><strong className="text-foreground">Accessibility:</strong> Ensure sufficient contrast (WCAG AA minimum) between logo and background</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p><strong className="text-foreground">Resolution:</strong> Use @2x versions for high-DPI displays and print materials</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

