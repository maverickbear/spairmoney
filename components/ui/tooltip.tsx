"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProviderProps {
  children: React.ReactNode;
}

const TooltipContext = React.createContext<{ isOpen?: boolean }>({});

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <TooltipContext.Provider value={{}}>{children}</TooltipContext.Provider>;
}

type Side = "top" | "bottom" | "left" | "right";

interface TooltipContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const TooltipRootContext = React.createContext<TooltipContextValue | null>(null);

interface TooltipProps {
  children: React.ReactNode;
}

export function Tooltip({ children }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const value = React.useMemo(() => ({ open, setOpen }), [open, setOpen]);

  // Close on outside click (mobile and desktop)
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    const t = setTimeout(() => document.addEventListener("click", handleClick, true), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", handleClick, true);
    };
  }, [open]);

  return (
    <TooltipRootContext.Provider value={value}>
      <div ref={containerRef} className="relative inline-block">
        {children}
      </div>
    </TooltipRootContext.Provider>
  );
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

function TooltipTriggerImpl({ children, asChild }: TooltipTriggerProps) {
  const ctx = React.useContext(TooltipRootContext);
  if (!ctx) {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {} as any);
    }
    return <>{children}</>;
  }
  const { open, setOpen } = ctx;

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as { className?: string; onClick?: (e: React.MouseEvent) => void };
    return React.cloneElement(children, {
      onMouseEnter: handleOpen,
      onMouseLeave: handleClose,
      onClick: (e: React.MouseEvent) => {
        if (open) {
          setOpen(false);
          childProps.onClick?.(e);
        } else {
          setOpen(true);
          e.preventDefault();
          e.stopPropagation();
        }
      },
      className: cn("cursor-pointer", childProps.className),
    } as any);
  }
  return (
    <div
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onClick={(e) => {
        if (open) setOpen(false);
        else {
          setOpen(true);
          e.preventDefault();
        }
      }}
      className="cursor-pointer relative inline-block"
    >
      {children}
    </div>
  );
}

TooltipTriggerImpl.displayName = "TooltipTrigger";
export const TooltipTrigger = TooltipTriggerImpl;

export type TooltipVariant = "default" | "pill";

interface TooltipContentProps {
  children: React.ReactNode;
  /** Optional title. When provided, renders as bold title above body (with-title variant). Only used for default variant. */
  title?: React.ReactNode;
  className?: string;
  side?: Side;
  /** default = large informative tooltip; pill = compact label for nav/short text */
  variant?: TooltipVariant;
}

const sideClasses: Record<Side, string> = {
  top: "left-1/2 -translate-x-1/2 bottom-full mb-2",
  bottom: "left-1/2 -translate-x-1/2 top-full mt-2",
  left: "right-full mr-2 top-1/2 -translate-y-1/2",
  right: "left-full ml-2 top-1/2 -translate-y-1/2",
};

/** Arrow (pointer) facing the trigger. Color matches variant. */
function TooltipArrow({ side, variant }: { side: Side; variant: TooltipVariant }) {
  const isPill = variant === "pill";
  const arrowBySide: Record<
    Side,
    { base: string; fill: string }
  > = {
    top: {
      base: "absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent",
      fill: isPill ? "border-t-primary" : "border-t-white",
    },
    bottom: {
      base: "absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent",
      fill: isPill ? "border-b-primary" : "border-b-white",
    },
    left: {
      base: "absolute top-1/2 -translate-y-1/2 -right-2 w-0 h-0 border-t-[6px] border-b-[6px] border-l-[6px] border-transparent",
      fill: isPill ? "border-l-primary" : "border-l-white",
    },
    right: {
      base: "absolute top-1/2 -translate-y-1/2 -left-2 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-transparent",
      fill: isPill ? "border-r-primary" : "border-r-white",
    },
  };
  const { base, fill } = arrowBySide[side];
  return <span className={cn("pointer-events-none", base, fill)} aria-hidden />;
}

export function TooltipContent({
  children,
  title,
  className,
  side = "bottom",
  variant = "default",
}: TooltipContentProps) {
  const ctx = React.useContext(TooltipRootContext);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const open = ctx?.open ?? false;

  if (!mounted) {
    return null;
  }

  const isPill = variant === "pill";

  return (
    <span
      role="tooltip"
      className={cn(
        "absolute z-[60] text-left",
        "opacity-0 invisible transition-opacity duration-150 pointer-events-none",
        open && "opacity-100 visible",
        sideClasses[side],
        isPill
          ? "px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground shadow-md whitespace-nowrap"
          : cn(
              "px-3 py-2.5 rounded-lg bg-white text-neutral-900 shadow-md border border-gray-200",
              "min-w-0 max-w-[720px] max-[480px]:max-w-[min(720px,calc(100vw-2rem))]"
            ),
        className
      )}
    >
      {!isPill && <TooltipArrow side={side} variant={variant} />}
      {isPill ? (
        <span className="leading-snug">{children}</span>
      ) : title != null ? (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-neutral-900 leading-tight">{title}</p>
          <div className="text-sm font-normal text-neutral-700 leading-snug">{children}</div>
        </div>
      ) : (
        <div className="text-sm font-normal text-neutral-900 leading-snug">{children}</div>
      )}
    </span>
  );
}
