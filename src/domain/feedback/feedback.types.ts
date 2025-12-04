/**
 * Feedback Domain Types
 */

export interface BaseFeedback {
  id: string;
  userId: string;
  rating: number;
  feedback: string | null;
  createdAt: Date;
  updatedAt: Date;
}

