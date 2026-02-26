import { Shield } from "lucide-react";
import { makeSubscriptionsService } from "@/src/application/subscriptions/subscriptions.factory";
import { ContentPageLayout } from "@/components/common/content-page-layout";
import { LegalSection } from "@/components/common/legal-section";

export const metadata = {
  title: "Privacy Policy - Spair Money",
  description: "Privacy Policy for Spair Money",
};

const LAST_UPDATED = "February 26, 2025";

const externalLinkClass =
  "text-foreground underline underline-offset-4 hover:--sentiment-positive";

export default async function PrivacyPolicyPage() {
  let proPlanName = "PRO";
  try {
    const subscriptionsService = makeSubscriptionsService();
    const plans = await subscriptionsService.getPlans();
    const proPlan = plans.find((p) => p.name === "pro");
    proPlanName = proPlan?.name ?? "PRO";
  } catch (error: unknown) {
    const err = error as { message?: string };
    const msg = err?.message ?? "";
    if (
      !msg.includes("prerender") &&
      !msg.includes("HANGING_PROMISE") &&
      !msg.includes("fetch() rejects")
    ) {
      console.error("Error fetching plans:", error);
    }
  }

  return (
    <ContentPageLayout
      hero={{
        icon: <Shield className="h-10 w-10 shrink-0 --sentiment-positive" />,
        title: "Privacy Policy",
        subtitle: `Last updated: ${LAST_UPDATED}`,
      }}
    >
      <article className="space-y-6">
        <LegalSection title="Introduction">
          <p>
            Spair Money is operated by Maverick Bear Design, a Canadian company
            (&quot;Company,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to
            protecting your privacy. This Privacy Policy (&quot;Policy&quot;) describes how we
            collect, use, disclose, and safeguard personal and other information
            when you use the Spair Money financial management application and
            related services (the &quot;Service&quot;).
          </p>
          <p>
            Please read this Policy carefully. By accessing or using the Service,
            you acknowledge that you have read this Policy and consent to the
            collection, use, and disclosure of your information as described
            herein. If you do not agree, you must not use the Service.
          </p>
        </LegalSection>

        <LegalSection title="Information We Collect">
          <div>
            <h3>Information You Provide</h3>
            <p>
              We collect information that you provide directly to us, including:
            </p>
            <ul>
              <li>Name and email address</li>
              <li>Phone number (optional)</li>
              <li>Profile picture or avatar URL (optional)</li>
              <li>Payment and billing information (processed by our payment
                provider; we do not store full payment card details)</li>
            </ul>
          </div>
          <div>
            <h3>Financial and Transaction Information</h3>
            <p>
              To provide the Service, we collect and store financial and
              transaction-related information that you enter, import, or that is
              generated through your use of the Service, including:
            </p>
            <ul>
              <li>
                <strong>Transactions:</strong> Amounts, dates, descriptions,
                categories, subcategories, tags, and recurring patterns
              </li>
              <li>
                <strong>Accounts:</strong> Account names, types, balances,
                limits, and (where applicable) account identifiers; data may be
                entered manually or imported via CSV — we do not store your
                bank login credentials
              </li>
              <li>
                <strong>Budgets and goals:</strong> Budget amounts, savings
                goals, progress, target amounts, and priorities
              </li>
              <li>
                <strong>Planned and recurring payments:</strong> Payment
                schedules, due dates, amounts, and related reminders
              </li>
              <li>
                <strong>Subscription tracking:</strong> Information about
                recurring subscriptions and services you track within the
                Service
              </li>
              <li>
                <strong>Investments:</strong> Securities, holdings, positions,
                portfolio values, investment transactions, and related data
              </li>
              <li>
                <strong>Debts:</strong> Loan types, balances, interest rates,
                payment schedules, payment history, and related data
              </li>
              <li>
                <strong>Receipt and categorization:</strong> Where you use
                receipt scanning, we may process images and extracted data to
                provide transaction suggestions; historical patterns may be
                used for AI-powered categorization
              </li>
              <li>
                <strong>AI usage:</strong> Queries, responses, and insights
                generated through AI-powered features (e.g., categorization,
                insights)
              </li>
            </ul>
          </div>
          <div>
            <h3>Information Collected Automatically</h3>
            <p>When you use the Service, we may automatically collect:</p>
            <ul>
              <li>Device and browser information and identifiers</li>
              <li>Usage data and analytics (e.g., feature use, session duration)</li>
              <li>IP address and general location data</li>
              <li>Cookies and similar technologies (as described in this Policy)</li>
            </ul>
          </div>
        </LegalSection>

        <LegalSection title="Cookies and Similar Technologies">
          <p>
            We use cookies and similar technologies (e.g., local storage) to
            operate the Service and to remember your preferences.
          </p>
          <div>
            <h3>Types of cookies we use</h3>
            <ul>
              <li>
                <strong>Strictly necessary:</strong> Required for the Service to
                function (e.g., authentication, session management, security).
                These cannot be disabled.
              </li>
              <li>
                <strong>Preferences:</strong> Remember your settings (e.g.,
                language, cookie consent choice). You can manage these through
                the cookie banner when you first visit or by clearing your
                browser data.
              </li>
              <li>
                <strong>Analytics and performance:</strong> If we use
                non-essential analytics or performance cookies, we will do so
                only with your consent. You may accept or reject non-essential
                cookies via the cookie preference banner.
              </li>
            </ul>
          </div>
          <p>
            Cookie duration depends on type: session cookies expire when you
            close your browser; persistent cookies may remain for a set period
            (e.g., 12 months for consent preferences). You can change your
            cookie choices at any time by clearing cookies or revisiting the
            cookie banner when it is shown. For more detail on how we use
            data, see the rest of this Policy.
          </p>
        </LegalSection>

        <LegalSection title="How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve the Service</li>
            <li>Process payments, manage your account, and enforce plan limits</li>
            <li>Import, store, and manage data you provide or import (e.g., via CSV)</li>
            <li>
              Provide AI-powered category suggestions and financial insights
              (e.g., via OpenAI), and receipt-scanning features where available
            </li>
            <li>
              Manage household accounts and member permissions (on {proPlanName}{" "}
              and applicable plans)
            </li>
            <li>Calculate and display budgets, goals, investments, debts, and planned payments</li>
            <li>Generate reports, analytics, and financial health scores (e.g., Spair Score)</li>
            <li>
              Send transactional and service-related emails (e.g., verification,
              password reset, notifications) via our email provider (Resend)
            </li>
            <li>Respond to inquiries and provide customer support</li>
            <li>Monitor performance and diagnose errors (e.g., via Sentry), and protect against abuse</li>
            <li>Comply with legal obligations and enforce our Terms of Service</li>
            <li>Maintain security logs and audit trails for account and safety purposes</li>
          </ul>
        </LegalSection>

        <LegalSection title="How We Share Your Information">
          <p>
            We do not sell your personal or financial information. We do not
            sell or share your personal information for cross-context
            behavioral advertising. We may share your information only in the
            following circumstances:
          </p>
          <ul>
            <li>
              <strong>Service providers:</strong> With trusted third parties that
              help us operate the Service, under contractual obligations to
              protect your data, including:
              <ul>
                <li>
                  <strong>Stripe:</strong> Payment processing and subscription
                  management. We do not store payment card details; Stripe
                  handles all payment data in a PCI-compliant manner.
                </li>
                <li>
                  <strong>OpenAI:</strong> AI-powered categorization and
                  insights. Transaction-related data (e.g., descriptions,
                  patterns) may be sent to OpenAI to generate suggestions. We
                  minimize personally identifiable information shared and do not
                  use OpenAI to train models on your data for other customers.
                </li>
                <li>
                  <strong>Sentry:</strong> Error tracking and performance
                  monitoring. We filter sensitive data before sending
                  information to Sentry.
                </li>
                <li>
                  <strong>Resend:</strong> Transactional email delivery (e.g.,
                  verification, password reset). Your email address and
                  necessary account information are shared for delivery only.
                </li>
                <li>
                  <strong>Supabase:</strong> Database hosting, authentication,
                  and application backend. Your data is stored in Supabase
                  infrastructure under our configuration and security controls.
                </li>
                <li>
                  <strong>Vercel:</strong> Application hosting and delivery.
                  Usage and performance data may be processed by Vercel in
                  connection with serving the Service.
                </li>
              </ul>
            </li>
            <li>
              <strong>Household members:</strong> On plans that include
              household features ({proPlanName} and applicable plans), data may
              be shared with other members of your household as you configure.
              The account owner can view and manage household members. You are
              responsible for whom you invite.
            </li>
            <li>
              <strong>Legal compliance:</strong> When required by applicable
              law, court order, or governmental authority
            </li>
            <li>
              <strong>Business transfers:</strong> In connection with a merger,
              sale of assets, or similar transaction, subject to notice and
              continued protection of your information
            </li>
            <li>
              <strong>With your consent:</strong> When you have given explicit
              consent for a specific disclosure
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Third-Party Services">
          <p>
            We use trusted third-party services to provide certain features of
            our platform. These services have their own privacy policies and
            terms of service:
          </p>
          <div className="space-y-4">
            <div>
              <h3>Stripe — Payment Processing</h3>
              <p>
                We use Stripe to process subscription payments. When you
                subscribe to our service:
              </p>
              <ul>
                <li>We do not store or have access to your full payment card information</li>
                <li>All payment data is securely processed and stored by Stripe</li>
                <li>We only receive confirmation of successful payments and subscription status</li>
                <li>Stripe handles all PCI-compliant payment processing</li>
              </ul>
              <p>
                For more information about how Stripe handles your payment data,
                please review{" "}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={externalLinkClass}
                >
                  Stripe&apos;s Privacy Policy
                </a>
                .
              </p>
            </div>
            <div>
              <h3>OpenAI — AI-Powered Features</h3>
              <p>
                We use OpenAI&apos;s API to provide AI-powered categorization and
                financial insights. When you use AI features:
              </p>
              <ul>
                <li>
                  Transaction descriptions and patterns may be sent to OpenAI to
                  generate category suggestions
                </li>
                <li>
                  We do not send personally identifiable information (names,
                  account numbers, exact amounts) to OpenAI
                </li>
                <li>Transaction data is anonymized before processing by OpenAI</li>
                <li>AI-generated suggestions are stored in your account for future reference</li>
                <li>You can disable or ignore AI suggestions at any time</li>
                <li>
                  OpenAI may use data sent to their API to improve their
                  services, but they do not use it to train models that serve
                  other customers
                </li>
              </ul>
              <p>
                For more information about how OpenAI handles data, please
                review{" "}
                <a
                  href="https://openai.com/policies/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={externalLinkClass}
                >
                  OpenAI&apos;s Privacy Policy
                </a>
                .
              </p>
            </div>
            <div>
              <h3>Sentry — Error Tracking and Monitoring</h3>
              <p>
                We use Sentry to monitor application errors and performance.
                When errors occur:
              </p>
              <ul>
                <li>
                  Technical error information (error messages, stack traces,
                  performance data) may be sent to Sentry
                </li>
                <li>
                  We filter and remove sensitive data (passwords, payment
                  information, account numbers) before sending to Sentry
                </li>
                <li>Error logs help us identify and fix issues to improve the service</li>
                <li>
                  You can opt out of error tracking, though this may limit our
                  ability to provide support
                </li>
              </ul>
              <p>
                For more information about Sentry&apos;s data practices, please
                review{" "}
                <a
                  href="https://sentry.io/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={externalLinkClass}
                >
                  Sentry&apos;s Privacy Policy
                </a>
                .
              </p>
            </div>
            <div>
              <h3>Resend — Email Delivery</h3>
              <p>
                We use Resend to send transactional emails (verification codes,
                password resets, notifications):
              </p>
              <ul>
                <li>
                  Your email address and basic account information are shared with
                  Resend for email delivery
                </li>
                <li>
                  Resend processes emails on our behalf and does not use your
                  information for their own purposes
                </li>
                <li>
                  You can unsubscribe from marketing emails, but transactional
                  emails (verification, password resets) are required for account
                  security
                </li>
              </ul>
              <p>
                For more information about Resend&apos;s data practices, please
                review{" "}
                <a
                  href="https://resend.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={externalLinkClass}
                >
                  Resend&apos;s Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </LegalSection>

        <LegalSection title="International Data Transfers">
          <p>
            Your information may be processed in Canada and, where our service
            providers operate, in other countries (including the United States,
            where providers such as Supabase, Vercel, and Stripe may process or
            store data). When we transfer personal data outside the European
            Economic Area, we implement appropriate safeguards as required by
            applicable law, such as standard contractual clauses or adequacy
            decisions. By using the Service, you consent to such transfers in
            accordance with this Policy.
          </p>
        </LegalSection>

        <LegalSection title="Data Security">
          <p>
            We implement industry-standard security measures to protect your
            information:
          </p>
          <ul>
            <li>End-to-end encryption for data transmission (TLS 1.2+)</li>
            <li>Secure data storage with encryption at rest</li>
            <li>
              Row Level Security (RLS) at the database level to ensure data
              isolation between users and households
            </li>
            <li>
              Secure authentication via Supabase Auth with password hashing and
              email verification (OTP)
            </li>
            <li>Secure storage of sensitive tokens (Stripe payment tokens)</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Access controls and authentication mechanisms</li>
            <li>
              Compliance with financial data protection regulations (PIPEDA, GDPR,
              CCPA)
            </li>
            <li>
              Bank credentials are never stored — all data is entered manually or
              imported via CSV
            </li>
            <li>
              Household member data is isolated and only accessible to
              authorized members
            </li>
            <li>
              Security logging and audit trails for account actions (blocks,
              suspensions, deletions)
            </li>
            <li>Rate limiting to prevent abuse and unauthorized access</li>
            <li>Content Security Policy (CSP) headers to prevent XSS attacks</li>
            <li>
              Secure headers (HSTS, X-Frame-Options, X-Content-Type-Options) for
              additional protection
            </li>
          </ul>
          <p>
            However, no method of transmission over the Internet or electronic
            storage is 100% secure. While we strive to use commercially
            acceptable means to protect your data, we cannot guarantee absolute
            security.
          </p>
          <p>
            <strong>AI Categorization Data:</strong> Category learning data is
            stored locally within your account and is not shared with other
            users. The AI system analyzes only your own historical transaction
            patterns to provide personalized category suggestions. Transaction
            data sent to OpenAI is anonymized to protect your privacy.
          </p>
          <p>
            <strong>Account Security:</strong> We maintain security logs and
            audit trails for account actions including blocks, suspensions, and
            terminations. This information is used for security purposes and
            compliance with our Terms of Service.
          </p>
          <p>
            <strong>Data Breach Notification:</strong> In the event of a data
            breach that poses a real risk of significant harm to individuals, we
            will notify affected individuals and report to the Office of the
            Privacy Commissioner of Canada as required by applicable law.
          </p>
        </LegalSection>

        <LegalSection title="Your Rights and Choices">
          <p>Depending on your location and applicable law, you may have the right to:</p>
          <ul>
            <li>
              <strong>Access:</strong> Request access to the personal data we
              hold about you
            </li>
            <li>
              <strong>Correction:</strong> Request correction of inaccurate or
              incomplete personal data
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your account and
              associated data, subject to legal and operational requirements
            </li>
            <li>
              <strong>Portability:</strong> Receive your data in a portable
              format (e.g., export) where technically feasible
            </li>
            <li>
              <strong>Opt-out:</strong> Unsubscribe from marketing communications
              (transactional and service-related messages may still be sent)
            </li>
            <li>
              <strong>Object or restrict:</strong> Object to certain processing
              or request restriction in accordance with applicable law
            </li>
          </ul>
          <p>
            You can manage many preferences in your account settings. To
            exercise any of the above rights, contact us at legal@spair.co. We
            will respond within 30 days (or as required by applicable law).
          </p>
        </LegalSection>

        <LegalSection title="Data Retention">
          <p>
            We retain your information for as long as your account is active and
            as needed to provide the Service, and as required by law. In
            particular:
          </p>
          <ul>
            <li>
              <strong>Active accounts:</strong> Data is retained while your
              account is active and necessary for the Service
            </li>
            <li>
              <strong>Account deletion:</strong> Upon your request to delete
              your account, we will permanently delete your data in accordance
              with our internal procedures and applicable law
            </li>
            <li>
              <strong>Security and compliance:</strong> Security logs, audit
              trails, and similar records may be retained for a longer period
              for security, fraud prevention, and legal compliance
            </li>
            <li>
              <strong>Legal hold:</strong> We may retain data longer when
              required by law, regulation, or for the establishment, exercise,
              or defence of legal claims
            </li>
            <li>
              <strong>Backups:</strong> Our infrastructure provider (Supabase)
              may retain backups for a limited period (e.g., 7–30 days depending
              on plan). We do not maintain separate long-term backup copies
              beyond such provider-managed backups.
            </li>
          </ul>
          <p>
            To request deletion of your data, contact us at legal@spair.co. We
            will process requests within 30 days (or as required by applicable
            law).
          </p>
        </LegalSection>

        <LegalSection title="Children's Privacy">
          <p>
            The Service is not directed to individuals under the age of 18. We
            do not knowingly collect personal information from children under
            18. If you believe we have collected such information, please
            contact us at legal@spair.co and we will take steps to delete it.
          </p>
        </LegalSection>

        <LegalSection title="Changes to This Privacy Policy">
          <p>
            We may update this Policy from time to time. We will post the
            revised Policy on this page and update the &quot;Last updated&quot; date.
            Material changes may also be communicated via the Service or email
            where appropriate. Your continued use of the Service after the
            effective date of the revised Policy constitutes your acceptance of
            it. We encourage you to review this Policy periodically.
          </p>
        </LegalSection>

        <LegalSection title="Your Rights Under Data Protection Laws">
          <p>
            Depending on your location, you may have additional rights under data
            protection laws:
          </p>
          <div className="space-y-4">
            <div>
              <h3>PIPEDA (Canada)</h3>
              <p>
                As a Canadian company, we comply with PIPEDA. You have the right
                to access, correct, and challenge the accuracy of your personal
                information. You may also file a complaint with the Privacy
                Commissioner of Canada if you believe we have violated your
                privacy rights.
              </p>
            </div>
            <div>
              <h3>GDPR (European Economic Area)</h3>
              <p>
                If you are located in the EEA, you have the right to: access
                your data, rectify inaccurate data, erase your data (&quot;right to
                be forgotten&quot;), restrict processing, data portability, object to
                processing, and withdraw consent. You may also lodge a complaint
                with your local data protection authority.
              </p>
              <p>
                <strong>Legal basis for processing:</strong> We process your
                data where necessary for the performance of our contract with
                you (providing the Service), to comply with legal obligations,
                for our legitimate interests (e.g., security, improving the
                Service, fraud prevention), and, where applicable, based on your
                consent (e.g., non-essential cookies).
              </p>
            </div>
            <div>
              <h3>CCPA (California)</h3>
              <p>
                If you are a California resident, you have the right to: know
                what personal information is collected, access your personal
                information, delete your personal information, opt-out of the
                sale of personal information (we do not sell your data), and
                non-discrimination for exercising your rights.
              </p>
            </div>
          </div>
          <p>
            To exercise any of these rights, please contact us at
            legal@spair.co. We will respond to your request within 30
            days (or as required by applicable law).
          </p>
        </LegalSection>

        <LegalSection title="Contact Us">
          <p>
            For questions about this Policy or our data practices, or to
            exercise your privacy rights (access, correction, deletion,
            portability, or complaints), please contact us:
          </p>
          <div className="space-y-2 text-sm [&_strong]:text-foreground">
            <p><strong>Operator:</strong> Maverick Bear Design (Canada)</p>
            <p><strong>Product:</strong> Spair Money</p>
            <p><strong>Privacy & legal:</strong> legal@spair.co</p>
            <p><strong>Security:</strong> security@spair.co</p>
            <p><strong>Support:</strong> support@spair.co</p>
          </div>
          <p>
            For data subject requests or privacy complaints, please email
            legal@spair.co with &quot;Privacy Request&quot; in the subject line. We
            will respond within 30 days (or as required by applicable law).
          </p>
        </LegalSection>
      </article>
    </ContentPageLayout>
  );
}
