"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarAmountInput } from "@/components/common/dollar-amount-input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { locationSchema, LocationFormData } from "@/src/domain/taxes/taxes.validations";

// US States
const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

// Canadian Provinces and Territories
const CANADIAN_PROVINCES = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
];

type Country = "US" | "CA";

interface IncomeOnboardingFormProps {
  onSuccess?: () => void;
  hideCard?: boolean;
  showButtons?: boolean;
  onSkip?: () => void;
  onSubmit?: () => void;
  selectedExpectedAnnualIncome?: number | null;
  onExpectedAnnualIncomeChange?: (amount: number | null) => void;
  selectedCountry?: Country | null;
  selectedStateOrProvince?: string | null;
  onLocationChange?: (location: LocationFormData) => void;
}

export function IncomeOnboardingForm({
  onSuccess,
  hideCard = false,
  showButtons = true,
  onSkip,
  onSubmit,
  selectedExpectedAnnualIncome: controlledExpectedAnnualIncome,
  onExpectedAnnualIncomeChange,
  selectedCountry: controlledCountry,
  selectedStateOrProvince: controlledStateOrProvince,
  onLocationChange,
}: IncomeOnboardingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [internalExpectedAnnualIncome, setInternalExpectedAnnualIncome] = useState<
    number | undefined
  >(undefined);
  const [loading, setLoading] = useState(false);

  // Location form
  const locationForm = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      country: (controlledCountry || "US") as "US" | "CA",
      stateOrProvince: (controlledStateOrProvince as LocationFormData["stateOrProvince"]) ?? null,
    },
    mode: "onChange",
  });

  const selectedCountry = locationForm.watch("country");
  const selectedStateOrProvince = locationForm.watch("stateOrProvince");
  const prevLocationRef = useRef<{ country: string; stateOrProvince: string | null } | null>(null);

  const expectedAnnualIncome =
    controlledExpectedAnnualIncome !== undefined
      ? controlledExpectedAnnualIncome
      : internalExpectedAnnualIncome;

  // Update location when controlled values change
  useEffect(() => {
    if (controlledCountry !== undefined && controlledCountry !== selectedCountry) {
      locationForm.setValue("country", (controlledCountry || "US") as "US" | "CA");
    }
    if (
      controlledStateOrProvince !== undefined &&
      controlledStateOrProvince !== selectedStateOrProvince
    ) {
      locationForm.setValue("stateOrProvince", controlledStateOrProvince as LocationFormData["stateOrProvince"]);
    }
  }, [controlledCountry, controlledStateOrProvince, selectedCountry, selectedStateOrProvince, locationForm]);

  const notifyLocationChange = useCallback(
    (country: string, stateOrProvince: string | null) => {
      if (!onLocationChange) return;
      const currentLocation = { country, stateOrProvince };
      if (
        !prevLocationRef.current ||
        prevLocationRef.current.country !== currentLocation.country ||
        prevLocationRef.current.stateOrProvince !== currentLocation.stateOrProvince
      ) {
        prevLocationRef.current = currentLocation;
        onLocationChange({
          country: currentLocation.country as "US" | "CA",
          stateOrProvince: (currentLocation.stateOrProvince || undefined) as LocationFormData["stateOrProvince"],
        });
      }
    },
    [onLocationChange]
  );

  useEffect(() => {
    if (selectedCountry && !prevLocationRef.current) {
      notifyLocationChange(selectedCountry as string, selectedStateOrProvince || null);
    }
  }, []);

  function handleExpectedAnnualIncomeChange(value: number | undefined) {
    const next = value ?? null;
    if (onExpectedAnnualIncomeChange) {
      onExpectedAnnualIncomeChange(next);
    } else {
      setInternalExpectedAnnualIncome(value);
    }
  }

  async function handleSubmit() {
    const amount = expectedAnnualIncome != null ? expectedAnnualIncome : 0;
    if (amount <= 0) {
      toast({
        title: "Please enter your annual household income",
        description:
          "Enter your expected annual household income to personalize your dashboard.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/v2/onboarding/income", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expectedAnnualIncome: amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save income");
      }

      toast({
        title: "Income saved",
        description: "Your dashboard has been personalized based on your expected income.",
        variant: "success",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error saving income:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save income. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/dashboard");
    }
  }

  const statesOrProvinces =
    selectedCountry === "US"
      ? US_STATES
      : selectedCountry === "CA"
        ? CANADIAN_PROVINCES
        : [];

  const incomeSection = (
    <div className="space-y-6">
      {/* Location Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Location</Label>
          <p className="text-xs text-muted-foreground">
            Used to automatically calculate taxes for accurate budget and emergency fund calculations.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Controller
              name="country"
              control={locationForm.control}
              render={({ field }) => (
                <Tabs
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    locationForm.setValue("stateOrProvince", null);
                    notifyLocationChange(value, null);
                  }}
                  className="w-full"
                >
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="US" className="w-full">
                      United States
                    </TabsTrigger>
                    <TabsTrigger value="CA" className="w-full">
                      Canada
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            />
            {locationForm.formState.errors.country && (
              <p className="text-sm text-destructive">
                {locationForm.formState.errors.country.message}
              </p>
            )}
          </div>

          {selectedCountry && statesOrProvinces.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="stateOrProvince">
                {selectedCountry === "US" ? "State" : "Province/Territory"}
              </Label>
              <Controller
                name="stateOrProvince"
                control={locationForm.control}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                      notifyLocationChange(selectedCountry, value);
                    }}
                  >
                    <SelectTrigger id="stateOrProvince">
                      <SelectValue
                        placeholder={`Select your ${selectedCountry === "US" ? "state" : "province/territory"}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {statesOrProvinces.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {locationForm.formState.errors.stateOrProvince && (
                <p className="text-sm text-destructive">
                  {locationForm.formState.errors.stateOrProvince.message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Income Section - single annual amount */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Annual Household Income</Label>
          <p className="text-xs text-muted-foreground">
            Used to personalize your budgets and calculate accurate emergency fund targets.
          </p>
        </div>
        <div>
          <Label htmlFor="expected-annual-income" className="text-sm text-muted-foreground mb-1 block">
            Enter your annual household income
          </Label>
          <DollarAmountInput
            id="expected-annual-income"
            value={expectedAnnualIncome ?? undefined}
            onChange={handleExpectedAnnualIncomeChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );

  const buttons = showButtons && (
    <div className="flex gap-3 pt-4">
      <Button
        onClick={onSubmit || handleSubmit}
        disabled={
          loading ||
          (expectedAnnualIncome == null || expectedAnnualIncome <= 0)
        }
        className="flex-1"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Continue"
        )}
      </Button>
      <Button onClick={onSkip || handleSkip} variant="outline" disabled={loading}>
        Skip
      </Button>
    </div>
  );

  const content = (
    <div className={`space-y-6 ${hideCard ? "px-0" : ""}`}>
      {incomeSection}
      {buttons}
    </div>
  );

  if (hideCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Annual Household Income & Location</CardTitle>
        <CardDescription>
          Used to tailor your budgets and insights. Location is used to automatically calculate
          taxes for accurate budget and emergency fund calculations. Not shared with anyone.
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
