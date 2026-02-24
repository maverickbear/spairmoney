"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/utils/api-base-url";
import { usePagePerformance } from "@/hooks/use-page-performance";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/common/page-header";
import { useToast } from "@/components/toast-provider";
import { feedbackSchema, FeedbackData } from "@/lib/validations/feedback";
import { Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";


export default function FeedbackPage() {
  const t = useTranslations("nav");
  const tFeedback = useTranslations("feedbackPage");
  const perf = usePagePerformance("Feedback");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  
  useEffect(() => {
    perf.markComplete();
  }, [perf]);

  const form = useForm<FeedbackData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: undefined,
      feedback: "",
    },
  });

  const handleRatingClick = (rating: number) => {
    setSelectedRating(rating);
    form.setValue("rating", rating);
  };

  async function onSubmit(data: FeedbackData) {
    if (!data.rating) {
      toast({
        title: tFeedback("ratingRequired"),
        description: tFeedback("ratingRequiredDescription"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl("/api/feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tFeedback("failedToSubmit"));
      }

      toast({
        title: tFeedback("thankYou"),
        description: tFeedback("thankYouDescription"),
      });

      form.reset();
      setSelectedRating(null);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : tFeedback("failedToSubmit"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={t("feedback")}
      />

      <div className="w-full p-4 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>{tFeedback("rateExperience")}</CardTitle>
          <CardDescription>
            {tFeedback("rateExperienceDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-3">
              <Label>{tFeedback("ratingLabel")}</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRatingClick(rating)}
                    disabled={isSubmitting}
                    className={cn(
                      "transition-colors hover:scale-110",
                      selectedRating && selectedRating >= rating
                        ? "text-yellow-400"
                        : "text-muted-foreground hover:text-yellow-300"
                    )}
                  >
                    <Star
                      className={cn(
                        "h-8 w-8",
                        selectedRating && selectedRating >= rating
                          ? "fill-current"
                          : ""
                      )}
                    />
                  </button>
                ))}
              </div>
              {form.formState.errors.rating && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.rating.message}
                </p>
              )}
              {selectedRating && (
                <p className="text-sm text-muted-foreground">
                  {selectedRating === 1 && tFeedback("poor")}
                  {selectedRating === 2 && tFeedback("fair")}
                  {selectedRating === 3 && tFeedback("good")}
                  {selectedRating === 4 && tFeedback("veryGood")}
                  {selectedRating === 5 && tFeedback("excellent")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">{tFeedback("additionalFeedbackLabel")}</Label>
              <Textarea
                id="feedback"
                {...form.register("feedback")}
                placeholder={tFeedback("additionalFeedbackPlaceholder")}
                rows={6}
                disabled={isSubmitting}
              />
              {form.formState.errors.feedback && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.feedback.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting || !selectedRating} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {tFeedback("submitting")}
                </>
              ) : (
                tFeedback("submitFeedback")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

