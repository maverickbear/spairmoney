// Re-export types and constants from domain layer for backward compatibility
// This file does not import any server-only code

export {
  PLANNED_HORIZON_DAYS,
  type BasePlannedPayment as PlannedPayment,
  type PlannedPaymentFormData,
} from "@/src/domain/planned-payments/planned-payments.types";

