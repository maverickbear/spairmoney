/**
 * Subscription Services Domain Types
 */

export interface BaseSubscriptionServiceCategory {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseSubscriptionService {
  id: string;
  name: string;
  categoryId: string;
  logo: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseSubscriptionServicePlan {
  id: string;
  serviceId: string;
  planName: string;
  price: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

