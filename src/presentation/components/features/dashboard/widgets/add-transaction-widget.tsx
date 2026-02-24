"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { WidgetCard } from "./widget-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDateOnly } from "@/src/infrastructure/utils/timestamp";

interface AddTransactionWidgetProps {
  onTransactionAdded?: () => void;
}

interface Account {
  id: string;
  name: string;
  type: string;
  isDefault?: boolean;
}

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  subcategories?: Array<{ id: string; name: string; logo?: string | null }>;
}

export function AddTransactionWidget({ onTransactionAdded }: AddTransactionWidgetProps) {
  const t = useTranslations("dashboard");
  const tTx = useTranslations("transactions");
  const tToasts = useTranslations("toasts");
  const router = useRouter();
  const { toast } = useToast();
  
  
  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState<Date>(() => new Date());
  const [loading, setLoading] = useState(false);
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [accountId, setAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsRes, categoriesRes] = await Promise.all([
          fetch("/api/v2/accounts"),
          fetch("/api/v2/categories?all=true")
        ]);

        if (accountsRes.ok) {
          const accountsData: Account[] = await accountsRes.json();
          setAccounts(accountsData);
          if (accountsData && accountsData.length > 0) {
            const defaultAccount = accountsData.find((a) => a.isDefault);
            const initialAccountId = defaultAccount?.id ?? accountsData[0].id;
            setAccountId(initialAccountId);
            if (accountsData.length > 1) {
              const other = accountsData.find((a) => a.id !== initialAccountId);
              if (other) setToAccountId(other.id);
            }
          }
        }
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId) {
      if (!accountId) {
        toast({
          variant: "destructive",
          title: t("noAccountFound"),
          description: t("createAccountFirst"),
        });
      }
      return;
    }

    if (type === "transfer" && !toAccountId) {
      toast({
        variant: "destructive",
        title: t("destinationAccountRequired"),
        description: t("selectDestinationAccount"),
      });
      return;
    }

    if (type === "transfer" && accountId === toAccountId) {
       toast({
        variant: "destructive",
        title: t("invalidTransfer"),
        description: t("sameAccountTransfer"),
      });
      return;
    }

    try {
      setLoading(true);
      
      const payload: Record<string, unknown> = {
        type,
        amount: parseFloat(amount),
        description,
        date: formatDateOnly(transactionDate),
        accountId,
        categoryId: type === "transfer" ? null : (categoryId || null),
        subcategoryId: type === "transfer" ? null : (subcategoryId || null),
      };

      if (type === "transfer") {
        payload.toAccountId = toAccountId;
      }

      const response = await fetch("/api/v2/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create transaction");
      }

      toast({
        variant: "success",
        title: type === "transfer" ? t("transferSuccessful") : type === "expense" ? t("expenseAdded") : t("incomeAdded"),
        description: t("transactionCreated"),
      });
      
      setAmount("");
      setDescription("");
      setTransactionDate(new Date());
      setCategoryId("");
      setSubcategoryId("");
      router.refresh();
      onTransactionAdded?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: tToasts("error"),
        description: t("failedToAddTransaction"),
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filter categories based on selected type
  const filteredCategories = categories.filter((c) => c.type === type);
  const selectedCategory = filteredCategories.find((c) => c.id === categoryId);
  const hasSubcategories = Boolean(selectedCategory?.subcategories?.length);

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setSubcategoryId("");
  };

  return (
    <WidgetCard title={t("quickTransaction")} className="h-full">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Tabs value={type} onValueChange={(v) => setType(v as "expense" | "income" | "transfer")} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-[fit-content]">
            <TabsTrigger value="expense" className="text-xs">{tTx("expense")}</TabsTrigger>
            <TabsTrigger value="income" className="text-xs">{tTx("income")}</TabsTrigger>
            <TabsTrigger value="transfer" className="text-xs">{tTx("transfer")}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs text-muted-foreground">{t("amountLabel")}</Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-6 h-9 text-sm"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account" className="text-xs text-muted-foreground">
              {type === "transfer" ? t("from") : t("account")}
            </Label>
            <Select value={accountId} onValueChange={setAccountId} disabled={accounts.length === 0}>
              <SelectTrigger id="account" className="h-9 text-sm">
                <SelectValue placeholder={t("selectAccount")} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {type === "transfer" && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <Label htmlFor="toAccount" className="text-xs text-muted-foreground">{t("toAccount")}</Label>
            <Select value={toAccountId} onValueChange={setToAccountId} disabled={accounts.length < 2}>
              <SelectTrigger id="toAccount" className="h-9 text-sm">
                <SelectValue placeholder={t("selectDestination")} />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter(acc => acc.id !== accountId)
                  .map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {type !== "transfer" && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <Label htmlFor="category" className="text-xs text-muted-foreground">{t("categoryLabel")}</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={categoryId}
                onValueChange={handleCategoryChange}
                disabled={filteredCategories.length === 0}
              >
                <SelectTrigger id="category" className="h-9 text-sm flex-1 min-w-0">
                  <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasSubcategories && (
                <Select
                  value={subcategoryId}
                  onValueChange={setSubcategoryId}
                >
                  <SelectTrigger id="subcategory" className="h-9 text-sm flex-1 min-w-0 sm:max-w-[180px]" aria-label={t("categoryLabel")}>
                    <SelectValue placeholder={t("subcategoryOptional")} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategory?.subcategories?.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="description" className="text-xs text-muted-foreground">{t("descriptionLabel")}</Label>
            <Input
              id="description"
              placeholder={t("descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5 sm:w-[140px]">
            <Label className="text-xs text-muted-foreground">{t("dateLabel")}</Label>
            <DatePicker
              date={transactionDate}
              onDateChange={(d) => setTransactionDate(d ?? new Date())}
              size="small"
              className="h-9"
            />
          </div>
        </div>

        <Button
          type="submit"
          size="medium"
          className={cn(
            "w-full h-9 text-sm font-medium",
            type === "expense" && "bg-indigo-500 hover:bg-indigo-600",
            type === "income" && "bg-emerald-500 hover:bg-emerald-600",
            type === "transfer" && "bg-blue-500 hover:bg-blue-600"
          )}
          disabled={loading || !amount || accounts.length === 0}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Add ${type}`}
        </Button>
      </form>
    </WidgetCard>
  );
}
