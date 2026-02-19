/**
 * Subscription Services Domain Types (categories only)
 */

export interface BaseSubscriptionServiceCategory {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

