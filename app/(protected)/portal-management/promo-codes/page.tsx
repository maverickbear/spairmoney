"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PromoCodesTable } from "@/components/admin/promo-codes-table";
import { PromoCodeDialog } from "@/components/admin/promo-code-dialog";
import { Plus } from "lucide-react";
import type { PromoCode } from "@/lib/api/admin";

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);
  const [availablePlans, setAvailablePlans] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadPromoCodes();
    loadPlans();
  }, []);

  async function loadPromoCodes() {
    try {
      const response = await fetch("/api/v2/admin/promo-codes");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to load promo codes";
        console.error("Error loading promo codes:", errorMessage);
        setPromoCodes([]);
        return;
      }
      const data = await response.json();
      setPromoCodes(Array.isArray(data.promoCodes) ? data.promoCodes : []);
    } catch (error) {
      console.error("Error loading promo codes:", error);
      setPromoCodes([]);
    }
  }

  async function loadPlans() {
    try {
      const response = await fetch("/api/billing/plans");
      if (response.ok) {
        const data = await response.json();
        setAvailablePlans(
          (data.plans || []).map((plan: any) => ({
            id: plan.id,
            name: plan.name,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading plans:", error);
    }
  }

  function handleCreatePromoCode() {
    setEditingPromoCode(null);
    setIsDialogOpen(true);
  }

  function handleEditPromoCode(promoCode: PromoCode) {
    setEditingPromoCode(promoCode);
    setIsDialogOpen(true);
  }

  async function handleDeletePromoCode(id: string) {
    const response = await fetch(`/api/v2/admin/promo-codes?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete promo code");
    }

    await loadPromoCodes();
  }

  async function handleTogglePromoCodeActive(id: string, isActive: boolean) {
    const response = await fetch("/api/v2/admin/promo-codes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        isActive: !isActive,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to toggle promo code");
    }

    await loadPromoCodes();
  }

  return (
    <div className="w-full p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Promo Codes</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage promotional codes for discounts on subscriptions.
          </p>
        </div>
        <Button onClick={handleCreatePromoCode}>
          <Plus className="h-4 w-4 mr-2" />
          Create Promo Code
        </Button>
      </div>
      <PromoCodesTable
        promoCodes={promoCodes}
        loading={false}
        onEdit={handleEditPromoCode}
        onDelete={handleDeletePromoCode}
        onToggleActive={handleTogglePromoCodeActive}
      />

      <PromoCodeDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingPromoCode(null);
          }
        }}
        promoCode={editingPromoCode}
        onSuccess={() => {
          loadPromoCodes();
        }}
        availablePlans={availablePlans}
      />
    </div>
  );
}

