import { NextRequest, NextResponse } from "next/server";
import { 
  getPaymentMethods, 
  createSetupIntent, 
  deletePaymentMethod, 
  setDefaultPaymentMethod 
} from "@/lib/api/stripe";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { paymentMethods, error } = await getPaymentMethods(userId);

    if (error) {
      throw new AppError(error, 500);
    }

    return NextResponse.json({ paymentMethods });
  } catch (error) {
    console.error("Error getting payment methods:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get payment methods" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { clientSecret, error } = await createSetupIntent(userId);

    if (error || !clientSecret) {
      throw new AppError(error || "Failed to create setup intent", 500);
    }

    return NextResponse.json({ clientSecret });
  } catch (error) {
    console.error("Error creating setup intent:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create setup intent" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentMethodId } = body;

    if (!paymentMethodId) {
      throw new AppError("paymentMethodId is required", 400);
    }

    const { success, error } = await deletePaymentMethod(
      userId,
      paymentMethodId
    );

    if (!success) {
      throw new AppError(error || "Failed to delete payment method", 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete payment method" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentMethodId } = body;

    if (!paymentMethodId) {
      throw new AppError("paymentMethodId is required", 400);
    }

    const { success, error } = await setDefaultPaymentMethod(
      userId,
      paymentMethodId
    );

    if (!success) {
      throw new AppError(error || "Failed to set default payment method", 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting default payment method:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to set default payment method" },
      { status: 500 }
    );
  }
}

