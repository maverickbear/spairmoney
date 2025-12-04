import { NextRequest, NextResponse } from 'next/server';
import { makeImportJobsService } from '@/src/application/import-jobs/import-jobs.factory';
import { AppError } from '@/src/application/shared/app-error';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const service = makeImportJobsService();
    const job = await service.getImportJob(jobId);

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Error fetching job status:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to get job status' },
      { status: 500 }
    );
  }
}

