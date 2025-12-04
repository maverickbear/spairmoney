import { NextRequest, NextResponse } from 'next/server';
import { makePlaidService } from '@/src/application/plaid/plaid.factory';
import { getCurrentUserId } from '@/src/application/shared/feature-guard';
import { AppError } from '@/src/application/shared/app-error';

/**
 * Cancel preview and clean up orphaned PlaidConnection
 * Called when user cancels the account mapping dialog
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Missing itemId' },
        { status: 400 }
      );
    }

    // Use PlaidService to cancel preview
    const plaidService = makePlaidService();
    await plaidService.cancelPreview(itemId, userId);

    return NextResponse.json({
      success: true,
      message: 'Preview cancelled and connection cleaned up',
    });
  } catch (error: any) {
    console.error('[PLAID CANCEL] Error cancelling preview:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to cancel preview' },
      { status: 500 }
    );
  }
}

