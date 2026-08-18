"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { BrowseItem } from "./types";
import { NewBorrowRequestWizard } from "./new-borrow-request-wizard";
import { useToast } from "@/components/providers/toast-context";

interface BorrowerPortalContextValue {
  cart: BrowseItem[];
  toggleCartItem: (item: BrowseItem) => void;
  clearCart: () => void;
  openWizard: (items?: BrowseItem[] | null, type?: "borrow" | "requisition") => void;
  closeWizard: () => void;
}

const BorrowerPortalContext = createContext<BorrowerPortalContextValue | undefined>(undefined);

export function BorrowerPortalProvider({ children }: { children: ReactNode }) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardItems, setWizardItems] = useState<BrowseItem[]>([]);
  const [wizardType, setWizardType] = useState<"borrow" | "requisition" | null>(null);
  const [cart, setCart] = useState<BrowseItem[]>([]);
  const toast = useToast();

  const toggleCartItem = (item: BrowseItem) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) return prev.filter((i) => i.id !== item.id);
      return [...prev, item];
    });
  };

  const clearCart = () => setCart([]);

  const openWizard = (items?: BrowseItem[] | null, type?: "borrow" | "requisition") => {
    setWizardItems(items || []);
    if (type) {
      setWizardType(type);
    } else if (items && items.length > 0) {
      setWizardType(items[0].type === "asset" ? "borrow" : "requisition");
    } else {
      setWizardType(null);
    }
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setTimeout(() => {
      setWizardItems([]);
      setWizardType(null);
    }, 200); // clear after animation
  };

  return (
    <BorrowerPortalContext.Provider value={{ cart, toggleCartItem, clearCart, openWizard, closeWizard }}>
      {children}
      <NewBorrowRequestWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        prefilledItems={wizardItems}
        initialType={wizardType}
        onSuccess={(req) => {
          clearCart();
          toast.success(`${req.requestCode} submitted.`);
        }}
      />
    </BorrowerPortalContext.Provider>
  );
}

export function useBorrowerPortal() {
  const context = useContext(BorrowerPortalContext);
  if (!context) {
    throw new Error("useBorrowerPortal must be used within a BorrowerPortalProvider");
  }
  return context;
}
