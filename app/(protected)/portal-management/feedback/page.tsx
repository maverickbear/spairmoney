"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackTable, Feedback } from "@/components/admin/feedback-table";
import { Loader2, Star } from "lucide-react";

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [feedbackMetrics, setFeedbackMetrics] = useState<{
    total: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
  } | null>(null);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  async function loadFeedbacks() {
    try {
      setLoadingFeedbacks(true);
      const response = await fetch("/api/admin/feedback");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to load feedbacks";
        console.error("Error loading feedbacks:", errorMessage);
        setFeedbacks([]);
        setFeedbackMetrics(null);
        return;
      }
      const data = await response.json();
      setFeedbacks(Array.isArray(data.feedbacks) ? data.feedbacks : []);
      setFeedbackMetrics(data.metrics || null);
    } catch (error) {
      console.error("Error loading feedbacks:", error);
      setFeedbacks([]);
      setFeedbackMetrics(null);
    } finally {
      setLoadingFeedbacks(false);
    }
  }

  return (
    <div className="w-full p-4 lg:p-8">
      <div className="space-y-6">
        {feedbackMetrics && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{feedbackMetrics.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {feedbackMetrics.averageRating.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">out of 5.0</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">5 Star Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {feedbackMetrics.ratingDistribution[5] || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {feedbackMetrics.total > 0
                    ? `${((feedbackMetrics.ratingDistribution[5] || 0) / feedbackMetrics.total * 100).toFixed(1)}%`
                    : "0%"} of total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Ratings (1-2)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(feedbackMetrics.ratingDistribution[1] || 0) + (feedbackMetrics.ratingDistribution[2] || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {feedbackMetrics.total > 0
                    ? `${(((feedbackMetrics.ratingDistribution[1] || 0) + (feedbackMetrics.ratingDistribution[2] || 0)) / feedbackMetrics.total * 100).toFixed(1)}%`
                    : "0%"} of total
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>
              Breakdown of feedback by rating
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feedbackMetrics ? (
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = feedbackMetrics.ratingDistribution[rating] || 0;
                  const percentage = feedbackMetrics.total > 0
                    ? (count / feedbackMetrics.total) * 100
                    : 0;
                  return (
                    <div key={rating} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rating} Star{rating !== 1 ? 's' : ''}</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= rating
                                    ? "text-yellow-400 fill-current"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-muted-foreground">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Feedback</CardTitle>
            <CardDescription>
              View and manage feedback submissions from users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackTable
              feedbacks={feedbacks}
              loading={loadingFeedbacks}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

