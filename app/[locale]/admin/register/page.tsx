import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { Button } from "@/components/ui/button";
import { Shield, Users, Settings2, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { AdminRegisterForm } from "./admin-register-form";

export const metadata = {
  title: "Admin registration | Spair Money",
  description: "Create an admin account for the Spair Money admin portal.",
};

export default function AdminRegisterPage() {
  unstable_noStore();
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left side - Branding (almost black) */}
      <div className="hidden lg:flex flex-col justify-center p-12 bg-[#0d0d0d] relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.07]" style={{ filter: "invert(1)" }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-400">Admin</span>
            </div>
            <div className="flex items-center">
              <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
                <Logo variant="wordmark" color="white" width={200} height={53} priority />
              </Link>
            </div>
            <p className="text-lg text-zinc-400 max-w-md">
              Create an admin account to access the portal and manage the platform.
            </p>
          </div>

          <div className="space-y-6 pt-8">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary rounded-lg shrink-0">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-white">Secure access</h3>
                <p className="text-sm text-zinc-400">
                  Admin-only area with strict authentication.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary rounded-lg shrink-0">
                <Users className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-white">User management</h3>
                <p className="text-sm text-zinc-400">
                  Manage accounts, subscriptions, and support.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary rounded-lg shrink-0">
                <Settings2 className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-white">Platform settings</h3>
                <p className="text-sm text-zinc-400">
                  Configure plans, promo codes, and system options.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <Link href="/admin/login">
            <Button variant="ghost" size="small" className="-ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to admin sign in
            </Button>
          </Link>

          <div className="lg:hidden text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Admin</span>
            </div>
            <div className="flex justify-center mb-4">
              <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
                <Logo variant="wordmark" color="auto" width={180} priority />
              </Link>
            </div>
            <p className="text-muted-foreground text-sm">
              Create an admin account (name, email, and password)
            </p>
          </div>

          <div className="hidden lg:block space-y-2">
            <h2 className="text-3xl font-bold">Admin registration</h2>
            <p className="text-muted-foreground">
              Create an admin account (name, email, and password)
            </p>
          </div>

          <AdminRegisterForm />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/admin/login" className="underline hover:text-foreground">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
