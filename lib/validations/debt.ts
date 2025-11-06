import { z } from "zod";

export const debtSchema = z.object({
  name: z.string().min(1, "Name is required"),
  loanType: z.enum(["mortgage", "car_loan", "personal_loan", "credit_card", "student_loan", "business_loan", "other"], {
    errorMap: () => ({ message: "Loan type must be one of the supported types" }),
  }),
  initialAmount: z.number().positive("Initial amount must be positive"),
  downPayment: z.number().nonnegative("Down payment must be non-negative").default(0),
  currentBalance: z.number().nonnegative("Current balance must be non-negative"),
  interestRate: z.number().nonnegative("Interest rate must be non-negative"),
  totalMonths: z.number().positive("Total months must be positive"),
  firstPaymentDate: z.coerce.date({
    errorMap: () => ({ message: "First payment date is required" }),
  }),
  paymentFrequency: z.enum(["monthly", "biweekly", "weekly", "semimonthly", "daily"], {
    errorMap: () => ({ message: "Payment frequency must be one of the supported options" }),
  }).default("monthly"),
  paymentAmount: z.number().positive("Payment amount must be positive"),
  monthlyPayment: z.number().positive("Monthly payment must be positive"),
  principalPaid: z.number().nonnegative("Principal paid must be non-negative").default(0),
  interestPaid: z.number().nonnegative("Interest paid must be non-negative").default(0),
  additionalContributions: z.boolean().default(false),
  additionalContributionAmount: z.number().nonnegative("Additional contribution amount must be non-negative").optional().default(0),
  priority: z.enum(["High", "Medium", "Low"], {
    errorMap: () => ({ message: "Priority must be High, Medium, or Low" }),
  }).optional().default("Medium"),
  description: z.string().optional(),
  accountId: z.string().min(1, "Account is required").optional(),
  isPaused: z.boolean().default(false),
});

export type DebtFormData = z.infer<typeof debtSchema>;

