/**
 * Public API endpoint for Spare Design System documentation
 * 
 * GET /api/spareds/docs - Returns documentation links and info
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const docs = {
    name: 'Spare Design System (SpareDS)',
    version: '1.0.0',
    description: 'Design system completo de tokens semânticos para o Spare Finance',
    endpoints: {
      tokens: {
        all: `${baseUrl}/api/spareds/tokens`,
        defaultValues: `${baseUrl}/api/spareds/tokens?type=default-values`,
        foundation: `${baseUrl}/api/spareds/tokens?type=foundation`,
        semantic: `${baseUrl}/api/spareds/tokens?type=semantic`,
        component: `${baseUrl}/api/spareds/tokens?type=component`,
      },
      documentation: {
        readme: `${baseUrl}/api/spareds/docs`,
        colorSystem: 'See /spareds/docs/color-system.md',
        tokenHierarchy: 'See /spareds/docs/token-hierarchy.md',
        usageGuide: 'See /spareds/docs/usage-guide.md',
      },
    },
    hierarchy: {
      level1: 'Default Values - Valores brutos (hex, pixels)',
      level2: 'Foundation Tokens - Tokens primitivos fundamentais',
      level3: 'Semantic Tokens - Tokens com propósito semântico',
      level4: 'Component Tokens - Tokens específicos de componentes',
    },
    usage: {
      javascript: `import { getToken } from '@/spareds/tokens';
const color = getToken('component.button.primary.bg');`,
      api: `fetch('${baseUrl}/api/spareds/tokens?type=component')
  .then(res => res.json())
  .then(data => console.log(data));`,
    },
    links: {
      github: 'https://github.com/spare-finance/spare-finance',
      documentation: '/spareds/README.md',
    },
  };

  return NextResponse.json(docs, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

