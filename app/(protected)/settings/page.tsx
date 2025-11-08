"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileFormData } from "@/lib/validations/profile";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Edit, Save, X, User, CreditCard, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { PlanBadge } from "@/components/common/plan-badge";
import Link from "next/link";
import { UsageChart } from "@/components/billing/usage-chart";
import { PlanCard } from "@/components/billing/plan-card";
import { PaymentMethodCard } from "@/components/billing/payment-method-card";
import { UpgradePlanCard } from "@/components/billing/upgrade-plan-card";
import { PaymentHistory } from "@/components/billing/payment-history";
import { Subscription, Plan } from "@/lib/validations/plan";
import { PlanFeatures, LimitCheckResult } from "@/lib/api/limits";

// Profile interfaces
interface Profile {
  name: string;
  email: string;
  avatarUrl?: string;
  phoneNumber?: string;
  plan?: {
    name: "free" | "basic" | "premium";
    isShadow: boolean;
    ownerId?: string;
    ownerName?: string;
  } | null;
  household?: {
    isOwner: boolean;
    isMember: boolean;
    ownerId?: string;
    ownerName?: string;
  } | null;
}

// Billing interfaces
interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
}

// Profile Tab Component
function ProfileTab() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      avatarUrl: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const { getProfileClient } = await import("@/lib/api/profile-client");
      const profileData = await getProfileClient();
      if (profileData) {
        setProfile(profileData);
        form.reset({
          name: profileData.name || "",
          email: profileData.email || "",
          avatarUrl: profileData.avatarUrl || "",
          phoneNumber: profileData.phoneNumber || "",
        });
      } else {
        const defaultProfile: Profile = {
          name: "",
          email: "",
          avatarUrl: "",
          phoneNumber: "",
        };
        setProfile(defaultProfile);
        form.reset(defaultProfile);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      const defaultProfile: Profile = {
        name: "",
        email: "",
        avatarUrl: "",
        phoneNumber: "",
      };
      setProfile(defaultProfile);
      form.reset(defaultProfile);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: ProfileFormData) {
    try {
      setSaving(true);
      const { updateProfileClient } = await import("@/lib/api/profile-client");
      const updatedProfile = await updateProfileClient(data);
      setProfile(updatedProfile);
      setIsEditing(false);
      const successEvent = new CustomEvent("profile-saved", { detail: updatedProfile });
      window.dispatchEvent(successEvent);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (profile) {
      form.reset({
        name: profile.name || "",
        email: profile.email || "",
        avatarUrl: profile.avatarUrl || "",
        phoneNumber: profile.phoneNumber || "",
      });
    }
    setIsEditing(false);
  }

  function getAvatarUrl() {
    const avatarUrl = form.watch("avatarUrl") || profile?.avatarUrl;
    if (avatarUrl) {
      return avatarUrl;
    }
    return null;
  }

  function getInitials(name: string) {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Please upload an image smaller than 5MB", variant: "destructive" });
      return;
    }

    try {
      setUploading(true);

      // Create FormData
      const formData = new FormData();
      formData.append("file", file);

      // Upload to Supabase Storage
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errorMessage = "Failed to upload avatar";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON, try to get text
          try {
            const text = await res.text();
            errorMessage = text || errorMessage;
          } catch (textError) {
            // If all else fails, use status text
            errorMessage = res.statusText || errorMessage;
          }
        }
        throw new Error(errorMessage);
      }

      const { url } = await res.json().catch(() => {
        throw new Error("Failed to parse response from server");
      });

      // Update form with new avatar URL
      form.setValue("avatarUrl", url);
      
      // Save avatar URL to profile automatically
      try {
        const { updateProfileClient } = await import("@/lib/api/profile-client");
        const updatedProfile = await updateProfileClient({ avatarUrl: url });
        setProfile(updatedProfile);
        
        // Dispatch event to notify other components
        const successEvent = new CustomEvent("profile-saved", { detail: updatedProfile });
        window.dispatchEvent(successEvent);
      } catch (error) {
        console.error("Error saving avatar URL:", error);
        // Still show success for upload, but warn about save
        toast({ 
          title: "Uploaded", 
          description: "Avatar uploaded but failed to save. Please save your profile.", 
          variant: "destructive" 
        });
        return;
      }
      
      toast({ title: "Success", description: "Avatar uploaded and saved successfully", variant: "success" });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload avatar",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-24 bg-muted rounded-full w-24 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Profile</h2>
          <p className="text-sm md:text-base text-muted-foreground">Manage your profile information</p>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()!}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover border-2"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const initialsContainer = e.currentTarget.nextElementSibling;
                      if (initialsContainer) {
                        (initialsContainer as HTMLElement).style.display = "flex";
                      }
                    }}
                  />
                ) : null}
                <div
                  className={`h-24 w-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold border-2 ${
                    getAvatarUrl() ? "hidden" : "flex"
                  }`}
                >
                  {getInitials(form.watch("name") || profile?.name || "User")}
                </div>
              </div>
              
              {isEditing && (
                <div className="flex flex-col items-center space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    ref={fileInputRef}
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    disabled={uploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload Avatar"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    JPG, PNG or GIF. Max size 5MB
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              {isEditing ? (
                <>
                  <Input {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  {profile?.name || "Not set"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              {isEditing ? (
                <>
                  <Input
                    {...form.register("email")}
                    type="email"
                    placeholder="user@example.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  {profile?.email || "Not set"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              {isEditing ? (
                <>
                  <Input
                    {...form.register("phoneNumber")}
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                  />
                  {form.formState.errors.phoneNumber && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.phoneNumber.message}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  {profile?.phoneNumber || "Not set"}
                </p>
              )}
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan & Subscription</CardTitle>
          <CardDescription>
            Your current plan and household information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.plan && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Current Plan</span>
                </div>
                <PlanBadge plan={profile.plan.name} />
              </div>
              
              {profile.plan.isShadow && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm">
                  <p className="text-blue-800 dark:text-blue-200">
                    <strong>Shadow Subscription:</strong> You're inheriting the{" "}
                    <span className="font-semibold capitalize">{profile.plan.name}</span> plan from{" "}
                    <span className="font-semibold">{profile.plan.ownerName || "the owner"}</span>.
                  </p>
                </div>
              )}
              
              {!profile.plan.isShadow && profile.plan.name !== "free" && (
                <div className="text-sm text-muted-foreground">
                  You have an active subscription to the {profile.plan.name} plan.
                </div>
              )}
              
              {!profile.plan.isShadow && profile.plan.name === "free" && (
                <div className="text-sm text-muted-foreground">
                  You're currently on the free plan.
                </div>
              )}
            </div>
          )}

          {profile?.household && (profile.household.isOwner || profile.household.isMember) && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Household</span>
              </div>
              
              {profile.household.isOwner && (
                <div className="text-sm text-muted-foreground">
                  You are the owner of this household.
                </div>
              )}
              
              {profile.household.isMember && profile.household.ownerName && (
                <div className="text-sm text-muted-foreground">
                  You are a member of <span className="font-semibold">{profile.household.ownerName}</span>'s household.
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            {profile?.household?.isOwner && (
              <Link href="/settings?tab=billing">
                <Button variant="outline" className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Subscription
                </Button>
              </Link>
            )}
            <Link href="/members">
              <Button variant="outline" className="w-full">
                Manage Household
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Billing Tab Component
function BillingTab() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [limits, setLimits] = useState<PlanFeatures | null>(null);
  const [transactionLimit, setTransactionLimit] = useState<LimitCheckResult | null>(null);
  const [accountLimit, setAccountLimit] = useState<LimitCheckResult | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const syncSubscription = useCallback(async () => {
    try {
      console.log("[BILLING] Syncing subscription from Stripe...");
      const response = await fetch("/api/stripe/sync-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("[BILLING] Subscription synced successfully:", data.subscription);
        return true;
      } else {
        console.error("[BILLING] Failed to sync subscription:", data.error);
        return false;
      }
    } catch (error) {
      console.error("[BILLING] Error syncing subscription:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    loadBillingData();

    const success = searchParams.get("success");
    if (success) {
      syncSubscription().then((synced) => {
        if (synced) {
          loadBillingData();
        }
      });
    }
  }, [searchParams, syncSubscription]);

  async function loadBillingData() {
    try {
      const [subResponse, limitsAction, paymentMethodResponse] = await Promise.all([
        fetch("/api/billing/subscription"),
        import("@/lib/actions/billing").then(m => m.getBillingLimitsAction()),
        fetch("/api/billing/payment-method"),
      ]);

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData.subscription);
        setPlan(subData.plan);
        setLimits(subData.limits);
      }

      if (limitsAction) {
        setTransactionLimit(limitsAction.transactionLimit);
        setAccountLimit(limitsAction.accountLimit);
      }

      if (paymentMethodResponse.ok) {
        const paymentMethodData = await paymentMethodResponse.json();
        setPaymentMethod(paymentMethodData.paymentMethod);
      }
    } catch (error) {
      console.error("Error loading billing data:", error);
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Billing</h2>
          <p className="text-sm md:text-base text-muted-foreground">Manage your subscription and usage</p>
        </div>
      </div>

      {limits && transactionLimit && accountLimit && (
        <UsageChart
          limits={limits}
          transactionLimit={transactionLimit}
          accountLimit={accountLimit}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlanCard 
          subscription={subscription} 
          plan={plan} 
          onManage={loadBillingData}
        />
        <PaymentMethodCard 
          paymentMethod={paymentMethod}
          onManage={loadBillingData}
        />
      </div>

      <UpgradePlanCard 
        currentPlan={plan?.name} 
        currentPlanId={plan?.id}
        onUpgradeSuccess={loadBillingData}
      />

      <PaymentHistory />
    </div>
  );
}

// Main Settings Page
export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("profile");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["profile", "billing"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  function handleTabChange(value: string) {
    setActiveTab(value);
    router.push(`/settings?tab=${value}`, { scroll: false });
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-sm md:text-base text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <BillingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

