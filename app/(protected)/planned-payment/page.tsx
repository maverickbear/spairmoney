import { getPlannedPayments, PLANNED_HORIZON_DAYS } from "@/lib/api/planned-payments";
import { PlannedPaymentList } from "./planned-payment-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planned Payment - Spare Finance",
  description: "View and manage all your scheduled payments for the next 90 days",
};

export default async function PlannedPaymentPage() {
  // Get all scheduled planned payments (up to horizon)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizonDate = new Date(today);
  horizonDate.setDate(horizonDate.getDate() + PLANNED_HORIZON_DAYS);
  
  const plannedPayments = await getPlannedPayments({
    startDate: today,
    endDate: horizonDate,
    status: "scheduled",
  });

  return (
    <PlannedPaymentList plannedPayments={plannedPayments} />
  );
}

