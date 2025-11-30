import { NextRequest, NextResponse } from "next/server";
import { makeInvestmentsService } from "@/src/application/investments/investments.factory";
import { InvestmentTransactionFormData } from "@/src/domain/investments/investments.validations";
import { ZodError } from "zod";
import { guardFeatureAccess, getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to investments
    const featureGuard = await guardFeatureAccess(userId, "hasInvestments");
    if (!featureGuard.allowed) {
      return NextResponse.json(
        { 
          error: featureGuard.error?.message || "Investments are not available in your current plan",
          code: featureGuard.error?.code,
          planError: featureGuard.error,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id: transactionId } = await params;
    
    const service = makeInvestmentsService();
    
    // Handle security creation if needed
    let securityId = body.securityId;
    if (!securityId && body.security) {
      // Create security if it doesn't exist
      const security = await service.createSecurity({
        symbol: body.security.symbol,
        name: body.security.name,
        class: body.security.class,
      });
      securityId = security.id;
    }

    // Prepare transaction data
    const transactionData: Partial<InvestmentTransactionFormData> = {};
    if (body.date !== undefined) {
      transactionData.date = body.date instanceof Date ? body.date : new Date(body.date);
    }
    if (body.accountId !== undefined) transactionData.accountId = body.accountId;
    if (securityId !== undefined) transactionData.securityId = securityId || undefined;
    if (body.type !== undefined) transactionData.type = body.type;
    if (body.quantity !== undefined) transactionData.quantity = body.quantity;
    if (body.price !== undefined) transactionData.price = body.price;
    if (body.fees !== undefined) transactionData.fees = body.fees || 0;
    if (body.notes !== undefined) transactionData.notes = body.notes;

    const transaction = await service.updateInvestmentTransaction(transactionId, transactionData);

    // Handle price update if provided
    if (securityId && body.currentPrice && transactionData.date) {
      try {
        await service.createSecurityPrice({
          securityId,
          date: transactionData.date instanceof Date ? transactionData.date : new Date(transactionData.date),
          price: body.currentPrice,
        });
      } catch (error) {
        console.error("Error creating security price:", error);
        // Don't fail the transaction if price creation fails
      }
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error updating investment transaction:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update investment transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to investments
    const featureGuard = await guardFeatureAccess(userId, "hasInvestments");
    if (!featureGuard.allowed) {
      return NextResponse.json(
        { 
          error: featureGuard.error?.message || "Investments are not available in your current plan",
          code: featureGuard.error?.code,
          planError: featureGuard.error,
        },
        { status: 403 }
      );
    }

    const { id: transactionId } = await params;
    
    const service = makeInvestmentsService();
    await service.deleteInvestmentTransaction(transactionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting investment transaction:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete investment transaction" },
      { status: 500 }
    );
  }
}

