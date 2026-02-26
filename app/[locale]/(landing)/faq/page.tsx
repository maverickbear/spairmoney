"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ContentPageLayout } from "@/components/common/content-page-layout";
import { HelpCircle, Search, X } from "lucide-react";

export default function FAQPage() {
  const t = useTranslations("faq");
  const [plans, setPlans] = useState<Array<{ id: string; name: string; priceMonthly: number; priceYearly: number }>>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Fetch plans from public API
    fetch("/api/billing/plans/public")
      .then(res => res.json())
      .then(data => {
        if (data.plans) {
          setPlans(data.plans);
        }
      })
      .catch(err => console.error("Error fetching plans:", err));
  }, []);

  // Only Pro plan exists now
  const proPlan = plans.find(p => p.name === 'pro');
  const proPlanName = proPlan?.name || 'PRO';
  const proPriceMonthly = proPlan?.priceMonthly || 14.99;
  const proPriceYearly = proPlan?.priceYearly || 149.90;
  const planVars = {
    planName: proPlanName,
    priceMonthly: proPriceMonthly.toFixed(2),
    priceYearly: proPriceYearly.toFixed(2),
    pricePerMonth: (proPriceYearly / 12).toFixed(2),
  };

  const faqCategories = useMemo(() => {
    return [
      {
        title: t("categories.about.title"),
        questions: [1, 2, 3, 4].map((i) => ({
          question: t(`categories.about.q${i}`),
          answer: t(`categories.about.a${i}`),
        })),
      },
      {
        title: t("categories.plans.title"),
        questions: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
          question: t(`categories.plans.q${i}`),
          answer: t(`categories.plans.a${i}`, planVars),
        })),
      },
      {
        title: t("categories.features.title"),
        questions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => ({
          question: t(`categories.features.q${i}`),
          answer: t(`categories.features.a${i}`, planVars),
        })),
      },
      {
        title: t("categories.accountSupport.title"),
        questions: [
          ...([1, 2, 3, 4, 5, 6] as const).map((i) => ({
            question: t(`categories.accountSupport.q${i}`),
            answer: t(`categories.accountSupport.a${i}`),
          })),
          {
            question: t("categories.accountSupport.q7"),
            answer: t.rich("categories.accountSupport.a7", {
              policy: () => (
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-4 hover:--sentiment-positive"
                >
                  {t("categories.accountSupport.a7PolicyLabel")}
                </Link>
              ),
            }),
          },
        ],
      },
      {
        title: t("categories.technical.title"),
        questions: [1, 2, 3, 4].map((i) => ({
          question: t(`categories.technical.q${i}`),
          answer: t(`categories.technical.a${i}`),
        })),
      },
    ];
  }, [t, proPlanName, proPriceMonthly, proPriceYearly]);

  // Filter FAQ based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return faqCategories;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return faqCategories
      .map(category => {
        const filteredQuestions = category.questions.filter(faq => {
          const questionMatch = faq.question.toLowerCase().includes(query);
          const answerText = typeof faq.answer === 'string' 
            ? faq.answer.toLowerCase() 
            : faq.answer?.toString().toLowerCase() || '';
          const answerMatch = answerText.includes(query);
          return questionMatch || answerMatch;
        });

        if (filteredQuestions.length === 0) {
          return null;
        }

        return {
          ...category,
          questions: filteredQuestions,
        };
      })
      .filter((category): category is typeof faqCategories[0] => category !== null);
  }, [searchQuery, faqCategories]);

  return (
    <ContentPageLayout
      hero={{
        icon: (
          <HelpCircle className="h-10 w-10 shrink-0 --sentiment-positive sm:h-12 sm:w-12" />
        ),
        title: t("title"),
        subtitle: t("subtitle"),
      }}
    >
      <div className="space-y-8 sm:space-y-10">
        {/* Search */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground sm:h-5 sm:w-5"
              aria-hidden
            />
            <Input
              type="search"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-10 pr-10 text-sm sm:h-12 sm:pl-11 sm:pr-11 sm:text-base"
              aria-label={t("searchAriaLabel")}
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="medium"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setSearchQuery("")}
                aria-label={t("clearSearchAriaLabel")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-left text-sm text-muted-foreground">
              {t("resultsFound", {
                count: filteredCategories.reduce(
                  (acc, cat) => acc + cat.questions.length,
                  0
                ),
              })}
            </p>
          )}
        </div>

        {/* FAQ list */}
        {filteredCategories.length === 0 ? (
          <Card className="bg-muted/50">
            <CardContent className="px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {t("noResultsPrefix", { query: searchQuery })}
                <Button
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={() => setSearchQuery("")}
                >
                  {t("clearSearch")}
                </Button>
                .
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {filteredCategories.map((category, categoryIndex) => (
              <section key={categoryIndex} className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {category.title}
                </h2>
                <div className="w-full space-y-2 rounded-lg border border-border bg-card divide-y divide-border">
                  {category.questions.map((faq, faqIndex) => (
                    <div
                      key={faqIndex}
                      className="px-4 py-4 first:pt-4 last:pb-4 sm:px-6"
                    >
                      <h3 className="text-sm font-medium text-foreground sm:text-base">
                        {faq.question}
                      </h3>
                      <div className="mt-2">
                        {typeof faq.answer === "string" ? (
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {faq.answer}
                          </p>
                        ) : (
                          <div className="text-sm leading-relaxed text-muted-foreground">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* CTA */}
        <Card className="rounded-lg border border-border bg-muted/50">
          <CardHeader className="px-6 pb-2 pt-6 sm:px-8">
            <CardTitle className="text-lg font-semibold sm:text-xl">
              {t("stillHaveQuestions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6 sm:px-8 sm:pb-8">
            <p className="text-sm text-muted-foreground">
              {t("stillHaveQuestionsDescription")}
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <strong className="text-foreground">{t("emailLabel")}</strong>{" "}
                <a
                  href="mailto:support@spair.co"
                  className="break-all --sentiment-positive underline underline-offset-4 hover:--sentiment-positive/90"
                >
                  support@spair.co
                </a>
              </p>
              <p className="text-muted-foreground">
                {t("helpAfterSignIn")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ContentPageLayout>
  );
}

