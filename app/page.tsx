import dynamic from "next/dynamic";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { getCurrentUser } from "@/lib/api/auth";
import { startServerPagePerformance } from "@/lib/utils/performance";

// Lazy load heavy landing page components for better initial load performance
const HeroSection = dynamic(() => import("@/components/landing/hero-section").then(m => ({ default: m.HeroSection })), { ssr: true });
const FeaturesSection = dynamic(() => import("@/components/landing/features-section").then(m => ({ default: m.FeaturesSection })), { ssr: true });
const ParallaxFeaturesSection = dynamic(() => import("@/components/landing/parallax-features-section").then(m => ({ default: m.ParallaxFeaturesSection })), { ssr: true });
const TestimonialsSection = dynamic(() => import("@/components/landing/testimonials-section").then(m => ({ default: m.TestimonialsSection })), { ssr: true });
const PricingSection = dynamic(() => import("@/components/landing/pricing-section").then(m => ({ default: m.PricingSection })), { ssr: true });

export const metadata = {
  title: "Spare Finance - Powerful Tools for Easy Money Management",
  description: "Simple, modern, and designed to put you in control of your future. Track expenses, manage budgets, and achieve your financial goals.",
};

/**
 * Landing Page
 * 
 * This page serves as the public landing page accessible to all users,
 * whether authenticated or not. Users can access this page at any time
 * by navigating to "/".
 * 
 * After login, users are automatically redirected to /dashboard, but they
 * can always return to this landing page if they want to see the site.
 */
export default async function LandingPage() {
  const perf = startServerPagePerformance("Landing");
  
  // Check authentication status on server to show correct buttons immediately
  const user = await getCurrentUser();
  const isAuthenticated = !!user;
  
  perf.end();

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader isAuthenticated={isAuthenticated} />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <ParallaxFeaturesSection />
        <TestimonialsSection />
        <PricingSection />
      </main>
      <LandingFooter />
    </div>
  );
}

