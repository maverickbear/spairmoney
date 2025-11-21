"use client";

import { Suspense } from "react";
import { VerifyGoogleOtpForm } from "@/components/auth/verify-google-otp-form";

function VerifyGoogleOtpContent() {
  return <VerifyGoogleOtpForm />;
}

export default function VerifyGoogleOtpPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-6">
          <div className="h-10 bg-muted animate-pulse rounded-[12px]" />
          <div className="h-10 bg-muted animate-pulse rounded-[12px]" />
          <div className="h-10 bg-muted animate-pulse rounded-[12px]" />
        </div>
      </div>
    }>
      <VerifyGoogleOtpContent />
    </Suspense>
  );
}

