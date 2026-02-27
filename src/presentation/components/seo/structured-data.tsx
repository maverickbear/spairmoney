/**
 * Structured Data (JSON-LD) Component for SEO
 * 
 * Implements Schema.org structured data for:
 * - Organization
 * - WebSite
 * - SoftwareApplication
 * 
 * Reads settings from database via public API
 */

interface SEOSettings {
  organization: {
    name: string;
    logo: string;
    url: string;
    socialLinks: {
      twitter: string;
      linkedin: string;
      facebook: string;
      instagram: string;
    };
  };
  application: {
    name: string;
    description: string;
    category: string;
    operatingSystem: string;
    price: string;
    priceCurrency: string;
    offersUrl: string;
  };
  description: string;
}

interface StructuredDataProps {
  seoSettings?: SEOSettings;
}

export function StructuredData({ seoSettings }: StructuredDataProps) {
  // Use provided settings or fallback to defaults
  const settings = seoSettings;

  // Fallback to defaults if no settings
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.spair.co";
  const org = settings?.organization || {
    name: "Spair Money",
    logo: `${baseUrl}/icon.svg`,
    url: baseUrl,
    socialLinks: {
      twitter: "",
      linkedin: "",
      facebook: "",
      instagram: "",
    },
  };

  const app = settings?.application || {
    name: "Spair Money",
    description: "Take control of your finances with Spair Money. Track expenses, manage budgets, set savings goals, and build wealth together with your household.",
    category: "FinanceApplication",
    operatingSystem: "Web",
    price: "0",
    priceCurrency: "USD",
    offersUrl: "/pricing",
  };

  const description = settings?.description || app.description;

  // Build sameAs array from social links
  const sameAs: string[] = [];
  if (org.socialLinks.twitter) sameAs.push(org.socialLinks.twitter);
  if (org.socialLinks.linkedin) sameAs.push(org.socialLinks.linkedin);
  if (org.socialLinks.facebook) sameAs.push(org.socialLinks.facebook);
  if (org.socialLinks.instagram) sameAs.push(org.socialLinks.instagram);

  // Organization Schema (with @id for WebSite publisher reference)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${org.url}/#organization`,
    name: org.name,
    url: org.url,
    logo: org.logo.startsWith("http") ? org.logo : `${baseUrl}${org.logo}`,
    description: description,
    ...(sameAs.length > 0 && { sameAs }),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      url: `${org.url}/faq`,
      availableLanguage: "English",
    },
  };

  // WebSite Schema (with @id for WebPage isPartOf reference)
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${org.url}/#website`,
    name: org.name,
    url: org.url,
    description: description,
    publisher: { "@id": `${org.url}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${org.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // BreadcrumbList for homepage
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: org.url,
      },
    ],
  };

  // WebPage schema for homepage (rich results, clarity for crawlers)
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${org.url}/#webpage`,
    url: org.url,
    name: org.name,
    description: description,
    isPartOf: { "@id": `${org.url}/#website` },
    about: { "@id": `${org.url}/#organization` },
  };

  // SoftwareApplication Schema
  const offersUrl = app.offersUrl.startsWith("http") 
    ? app.offersUrl 
    : `${org.url}${app.offersUrl}`;

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.name,
    applicationCategory: app.category,
    operatingSystem: app.operatingSystem,
    description: app.description,
    url: org.url,
    offers: {
      "@type": "Offer",
      price: app.price,
      priceCurrency: app.priceCurrency,
      url: offersUrl,
      availability: "https://schema.org/InStock",
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 1 year from now
    },
    featureList: [
      "Expense Tracking",
      "Budget Management",
      "Savings Goals",
      "Investment Tracking",
      "Debt Management",
      "Household Finance",
      "Financial Reports",
      "Bank Account Integration",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
    </>
  );
}

