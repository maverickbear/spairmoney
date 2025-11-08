"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { PricingModal } from "@/components/billing/pricing-modal";

interface PricingModalContextType {
  openModal: () => void;
  closeModal: () => void;
  isOpen: boolean;
}

const PricingModalContext = createContext<PricingModalContextType | undefined>(undefined);

export function PricingModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <PricingModalContext.Provider value={{ openModal, closeModal, isOpen }}>
      {children}
      <PricingModal open={isOpen} onOpenChange={setIsOpen} />
    </PricingModalContext.Provider>
  );
}

export function usePricingModal() {
  const context = useContext(PricingModalContext);
  if (context === undefined) {
    throw new Error("usePricingModal must be used within a PricingModalProvider");
  }
  return context;
}

