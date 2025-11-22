/**
 * Public API endpoint for Spare Design System tokens
 * 
 * GET /api/spareds/tokens - Returns all tokens
 * GET /api/spareds/tokens/default-values - Returns default values
 * GET /api/spareds/tokens/foundation - Returns foundation tokens
 * GET /api/spareds/tokens/semantic - Returns semantic tokens
 * GET /api/spareds/tokens/component - Returns component tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import defaultValues from '@/spareds/tokens/colors/default-values.json';
import foundationTokens from '@/spareds/tokens/colors/foundation-tokens.json';
import semanticTokens from '@/spareds/tokens/colors/semantic-tokens.json';
import componentTokens from '@/spareds/tokens/colors/component-tokens.json';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  // CORS headers para acesso público
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  };

  // Handle OPTIONS request for CORS
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers });
  }

  try {
    switch (type) {
      case 'default-values':
        return NextResponse.json(defaultValues, { headers });
      
      case 'foundation':
        return NextResponse.json(foundationTokens, { headers });
      
      case 'semantic':
        return NextResponse.json(semanticTokens, { headers });
      
      case 'component':
        return NextResponse.json(componentTokens, { headers });
      
      default:
        // Return all tokens
        return NextResponse.json(
          {
            defaultValues,
            foundation: foundationTokens,
            semantic: semanticTokens,
            component: componentTokens,
            meta: {
              version: '1.0.0',
              lastUpdated: new Date().toISOString(),
              documentation: '/api/spareds/docs',
            },
          },
          { headers }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load tokens' },
      { status: 500, headers }
    );
  }
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

