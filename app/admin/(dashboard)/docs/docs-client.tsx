"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Loader2, FileText, BookOpen } from "lucide-react";

const DOC_ITEMS: { path: string; label: string }[] = [
  { path: "APP_OVERVIEW.md", label: "App Overview" },
  { path: "features/AUTH.md", label: "Auth" },
  { path: "features/DASHBOARD.md", label: "Dashboard" },
  { path: "features/REPORTS.md", label: "Reports" },
  { path: "features/ACCOUNTS.md", label: "Accounts" },
  { path: "features/TRANSACTIONS.md", label: "Transactions" },
  { path: "features/SUBSCRIPTIONS.md", label: "Subscriptions (recurring)" },
  { path: "features/PLANNED_PAYMENTS.md", label: "Planned payments" },
  { path: "features/BUDGETS.md", label: "Budgets" },
  { path: "features/GOALS.md", label: "Goals" },
  { path: "features/DEBTS.md", label: "Debts" },
  { path: "features/CATEGORIES.md", label: "Categories" },
  { path: "features/HOUSEHOLD_AND_MEMBERS.md", label: "Household & members" },
  { path: "features/PROFILE_AND_MY_ACCOUNT.md", label: "Profile & my account" },
  { path: "features/BILLING.md", label: "Billing (Stripe)" },
  { path: "features/ONBOARDING.md", label: "Onboarding" },
  { path: "features/INSIGHTS.md", label: "Insights (Spair Score)" },
  { path: "features/HELP_AND_SUPPORT.md", label: "Help & support" },
  { path: "features/FEEDBACK.md", label: "Feedback" },
  { path: "features/RECEIPTS.md", label: "Receipts" },
  { path: "features/TAXES.md", label: "Taxes" },
  { path: "features/ADMIN.md", label: "Admin" },
  { path: "LANDING_VS_FEATURES.md", label: "Landing vs features" },
];

export function DocsClient() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePath, setActivePath] = useState("APP_OVERVIEW.md");

  const loadDoc = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v2/admin/docs?path=${encodeURIComponent(path)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to load (${res.status})`);
      }
      const data = await res.json();
      setContent(data.content ?? "");
      setActivePath(path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load document");
      setContent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoc(activePath);
  }, []);

  return (
    <div className="flex h-full min-h-[70vh] w-full">
      <aside className="w-56 shrink-0 border-r bg-muted/20 p-3 overflow-y-auto">
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-foreground">
          <BookOpen className="h-4 w-4" />
          Documentation
        </div>
        <nav className="mt-2 flex flex-col gap-0.5">
          {DOC_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => loadDoc(item.path)}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                activePath === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0 overflow-auto">
        <div className="mx-auto max-w-3xl p-6 lg:p-8">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading…</span>
            </div>
          )}
          {error && !loading && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}
          {content && !loading && (
            <article className="docs-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children, ...props }) => (
                    <h1 className="mb-4 mt-6 border-b pb-2 text-2xl font-bold first:mt-0" {...props}>
                      {children}
                    </h1>
                  ),
                  h2: ({ children, ...props }) => (
                    <h2 className="mb-3 mt-6 text-xl font-semibold" {...props}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children, ...props }) => (
                    <h3 className="mb-2 mt-4 text-lg font-medium" {...props}>
                      {children}
                    </h3>
                  ),
                  p: ({ children, ...props }) => (
                    <p className="mb-3 leading-relaxed text-foreground" {...props}>
                      {children}
                    </p>
                  ),
                  ul: ({ children, ...props }) => (
                    <ul className="mb-3 list-disc pl-6 space-y-1" {...props}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol className="mb-3 list-decimal pl-6 space-y-1" {...props}>
                      {children}
                    </ol>
                  ),
                  li: ({ children, ...props }) => (
                    <li className="leading-relaxed" {...props}>
                      {children}
                    </li>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                      return (
                        <pre className="mb-3 overflow-x-auto rounded-md border bg-muted p-3 text-sm">
                          <code {...props}>{children}</code>
                        </pre>
                      );
                    }
                    return (
                      <code
                        className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children, ...props }) => (
                    <pre className="mb-3 overflow-x-auto rounded-md border bg-muted p-3 text-sm" {...props}>
                      {children}
                    </pre>
                  ),
                  table: ({ children, ...props }) => (
                    <div className="mb-4 overflow-x-auto">
                      <table className="w-full border-collapse text-sm" {...props}>
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children, ...props }) => (
                    <thead className="border-b bg-muted/50" {...props}>
                      {children}
                    </thead>
                  ),
                  th: ({ children, ...props }) => (
                    <th className="px-3 py-2 text-left font-medium" {...props}>
                      {children}
                    </th>
                  ),
                  td: ({ children, ...props }) => (
                    <td className="border-b px-3 py-2" {...props}>
                      {children}
                    </td>
                  ),
                  tr: ({ children, ...props }) => (
                    <tr className="border-b last:border-0" {...props}>
                      {children}
                    </tr>
                  ),
                  strong: ({ children, ...props }) => (
                    <strong className="font-semibold" {...props}>
                      {children}
                    </strong>
                  ),
                  a: ({ href, children, ...props }) => (
                    <a
                      href={href}
                      target={href?.startsWith("http") ? "_blank" : undefined}
                      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-content-link underline hover:no-underline"
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                  blockquote: ({ children, ...props }) => (
                    <blockquote
                      className="border-l-4 border-muted-foreground/30 pl-3 italic text-muted-foreground"
                      {...props}
                    >
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
