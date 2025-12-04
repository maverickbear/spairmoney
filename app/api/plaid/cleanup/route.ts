import { NextRequest, NextResponse } from 'next/server';
import { makePlaidService } from '@/src/application/plaid/plaid.factory';
import { getCurrentUserId } from '@/src/application/shared/feature-guard';
import { AppError } from '@/src/application/shared/app-error';

/**
 * API endpoint to clean up orphaned Plaid data
 * 
 * This endpoint can be called:
 * 1. Manually by admins
 * 2. By a scheduled job/cron
 * 3. After account disconnection (optional)
 * 
 * GET /api/plaid/cleanup - Clean up all orphaned data
 * GET /api/plaid/cleanup?userId=xxx - Clean up data for specific user
 */
export async function GET(req: NextRequest) {
  try {
    // Get current user (optional - can be called by system)
    const userId = await getCurrentUserId();
    
    // Get userId from query params if provided (for admin/system use)
    const searchParams = req.nextUrl.searchParams;
    const targetUserId = searchParams.get('userId') || userId || undefined;

    // Perform cleanup using PlaidService
    const plaidService = makePlaidService();
    const result = await plaidService.cleanupOrphanedData(targetUserId);

    return NextResponse.json({
      success: true,
      ...result,
      message: `Cleaned up ${result.connectionsCleaned} orphaned connections and ${result.transactionSyncCleaned} orphaned transaction sync records.`,
    });
  } catch (error: any) {
    console.error('Error during Plaid cleanup:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to perform cleanup', details: error.message },
      { status: 500 }
    );
  }
}

