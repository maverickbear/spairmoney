import { NextRequest, NextResponse } from 'next/server';
import { makePlaidService } from '@/src/application/plaid/plaid.factory';
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

    // Use PlaidService to disconnect all accounts
    const plaidService = makePlaidService();
    const result = await plaidService.disconnectAllAccounts(userId);

    return NextResponse.json({
      success: true,
      message: 'All Plaid connections removed successfully',
      connectionsRemoved: result.connectionsRemoved,
      accountsDisconnected: result.accountsDisconnected,
    });
  } catch (error: any) {
    console.error('Error disconnecting all Plaid connections:', error);

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
      { error: 'Failed to disconnect all Plaid connections' },
      { status: 500 }
    );
  }
}

