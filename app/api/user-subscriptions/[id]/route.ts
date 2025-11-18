import { NextRequest, NextResponse } from "next/server";
import {
  updateUserSubscription,
  deleteUserSubscription,
  pauseUserSubscription,
  resumeUserSubscription,
} from "@/lib/api/user-subscriptions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { getUserSubscriptions } = await import("@/lib/api/user-subscriptions");
    const subscriptions = await getUserSubscriptions();
    const subscription = subscriptions.find((s) => s.id === id);

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription, { status: 200 });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const subscription = await updateUserSubscription(id, body);
    return NextResponse.json(subscription, { status: 200 });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteUserSubscription(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete subscription" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === "pause") {
      const subscription = await pauseUserSubscription(id);
      return NextResponse.json(subscription, { status: 200 });
    } else if (action === "resume") {
      const subscription = await resumeUserSubscription(id);
      return NextResponse.json(subscription, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'pause' or 'resume'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error pausing/resuming subscription:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to pause/resume subscription" },
      { status: 500 }
    );
  }
}

