import { NextResponse } from "next/server";
import { updateAccount, deleteAccount } from "@/lib/api/accounts";
import { AccountFormData } from "@/lib/validations/account";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const account = await updateAccount(id, data as Partial<AccountFormData>);
    return NextResponse.json(account);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteAccount(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}

