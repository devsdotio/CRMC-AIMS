"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { BrowseItem } from "./types";
import { NewBorrowRequestWizard } from "./new-borrow-request-wizard";

interface BorrowerPortalContextValue {
  openWizard: (item?: BrowseItem | null, type?: "borrow" | "requisition") => void;
  closeWizard: () => void;
}

const BorrowerPortalContext = createContext<BorrowerPortalContextValue | undefined>(undefined);

export function BorrowerPortalProvider({ children }: { children: ReactNode }) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardItem, setWizardItem] = useState<BrowseItem | null>(null);
  const [wizardType, setWizardType] = useState<"borrow" | "requisition" | null>(null);

  const openWizard = (item?: BrowseItem | null, type?: "borrow" | "requisition") => {
    setWizardItem(item || null);
    if (type) {
      setWizardType(type);
    } else if (item) {
      setWizardType(item.type === "asset" ? "borrow" : "requisition");
    } else {
      setWizardType(null);
    }
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setTimeout(() => {
      setWizardItem(null);
      setWizardType(null);
    }, 200); // clear after animation
  };

  return (
    <BorrowerPortalContext.Provider value={{ openWizard, closeWizard }}>
      {children}
      <NewBorrowRequestWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        prefilledItem={wizardItem}
        initialType={wizardType}
        onSuccess={(req) => {
          // You could add this to a global state or trigger a re-fetch
          console.log("Request created", req);
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
