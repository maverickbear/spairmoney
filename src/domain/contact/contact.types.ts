/**
 * Contact Domain Types
 */

export interface BaseContact {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "pending" | "read" | "replied" | "resolved";
  createdAt: Date;
  updatedAt: Date;
}

