import { getPlannedPayments, PLANNED_HORIZON_DAYS } from "@/lib/api/planned-payments";
import { PageHeader } from "@/components/common/page-header";
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
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title="Planned Payment"
        description={`All scheduled payments for the next ${PLANNED_HORIZON_DAYS} days`}
      />
      <PlannedPaymentList plannedPayments={plannedPayments} />
    </div>
  );
}

