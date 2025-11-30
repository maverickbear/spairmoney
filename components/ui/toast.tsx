"use client";

import * as React from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function ToastComponent({ toast, onClose }: ToastProps) {
  const { id, title, description, variant = "default" } = toast;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div className="relative shadow-lg transition-all animate-in slide-in-from-top-5 fade-in-0 duration-300">
      <Alert
        variant={variant === "destructive" ? "destructive" : "default"}
        className="pr-10"
    >
        {variant === "success" && <CheckCircle2 className="h-4 w-4" />}
        {variant === "destructive" && <AlertCircle className="h-4 w-4" />}
        <AlertTitle>{title}</AlertTitle>
        {description && <AlertDescription>{description}</AlertDescription>}
      </Alert>
      <button
        onClick={() => onClose(id)}
        className={cn(
          "absolute top-4 right-4 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity",
          variant === "destructive" && "text-destructive hover:bg-destructive/10",
          "text-muted-foreground hover:bg-accent"
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastComponent toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

