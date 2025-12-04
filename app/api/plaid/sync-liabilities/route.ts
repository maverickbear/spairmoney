import { NextRequest, NextResponse } from 'next/server';
import { makePlaidService } from '@/src/application/plaid/plaid.factory';
import { createServerClient } from '@/src/infrastructure/database/supabase-server';
import { guardBankIntegration, getCurrentUserId } from '@/src/application/shared/feature-guard';
import { throwIfNotAllowed } from '@/src/application/shared/feature-guard';
import { AppError } from '@/src/application/shared/app-error';

export async function POST(req: NextRequest) {
  try {
    // Get current user
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has access to bank integration
    const guardResult = await guardBankIntegration(userId);
    await throwIfNotAllowed(guardResult);

    // Parse request body
    const body = await req.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Missing itemId' },
        { status: 400 }
      );
    }

    // Get access token for this item
    const supabase = await createServerClient();
    const { data: connection, error: connectionError } = await supabase
      .from('PlaidConnection')
      .select('accessToken')
      .eq('itemId', itemId)
      .single();

    if (connectionError || !connection?.accessToken) {
      return NextResponse.json(
        { error: 'Plaid connection not found' },
        { status: 404 }
      );
    }

    // Sync liabilities using PlaidService
    const plaidService = makePlaidService();
    const result = await plaidService.syncAccountLiabilities(itemId, connection.accessToken);

    return NextResponse.json({
      success: true,
      synced: result.synced,
      updated: result.updated,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('Error syncing liabilities:', error);

    // Check if it's a plan error
    if (error.planError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          planError: error.planError,
        },
        { status: 403 }
      );
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to sync liabilities' },
      { status: 500 }
    );
  }
}

