"use client";

import { useMemo } from "react";
import {
  DollarSign,
  Package,
  Layers,
  Truck,
  TrendingUp,
  Boxes,
  ShieldCheck,
} from "lucide-react";
import type { PurchaseLot } from "@/types/purchase-lots";
import { cn } from "@/lib/utils";

interface PurchaseOrdersStatsProps {
  lots: PurchaseLot[];
}

export function PurchaseOrdersStats({ lots }: PurchaseOrdersStatsProps) {
  const stats = useMemo(() => {
    let totalSpend = 0;
    let totalUnitsReceived = 0;
    let totalUnitsRemaining = 0;
    let consumableCount = 0;
    let assetCount = 0;
    const suppliers = new Set<string>();

    for (const lot of lots) {
      const totalCostNum = parseFloat(lot.totalCost) || 0;
      totalSpend += totalCostNum;
      totalUnitsReceived += lot.quantity;
      totalUnitsRemaining += lot.quantityRemaining;

      if (lot.itemType === "asset") {
        assetCount += 1;
      } else {
        consumableCount += 1;
      }

      if (lot.supplierName?.trim()) {
        suppliers.add(lot.supplierName.trim());
      }
    }

    const totalLots = lots.length;
    const stockUtilizationPercent =
      totalUnitsReceived > 0
        ? Math.round((totalUnitsRemaining / totalUnitsReceived) * 100)
        : 0;

    const avgLotCost = totalLots > 0 ? totalSpend / totalLots : 0;

    return {
      totalSpend,
      totalLots,
      consumableCount,
      assetCount,
      totalUnitsReceived,
      totalUnitsRemaining,
      stockUtilizationPercent,
      supplierCount: suppliers.size,
      avgLotCost,
    };
  }, [lots]);

  const cards = [
    {
      title: "Total Procurement Spend",
      value: `₱${stats.totalSpend.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      subtitle: `Avg. ₱${stats.avgLotCost.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} / batch`,
      icon: DollarSign,
      iconColor: "text-status-active-text bg-status-active-bg/15 border-status-active-bg/30",
      accentGlow: "hover:border-status-active-bg/40",
    },
    {
      title: "Intake Batches Recorded",
      value: stats.totalLots.toLocaleString(),
      subtitle: `${stats.consumableCount} Consumables · ${stats.assetCount} Fixed Assets`,
      icon: Boxes,
      iconColor: "text-category-av-bg bg-category-av-bg/15 border-category-av-bg/30",
      accentGlow: "hover:border-category-av-bg/40",
    },
    {
      title: "Units Remaining in Lots",
      value: `${stats.totalUnitsRemaining.toLocaleString()} units`,
      subtitle: `${stats.totalUnitsReceived.toLocaleString()} received (${stats.stockUtilizationPercent}% in stock)`,
      icon: Layers,
      iconColor: "text-category-transport-bg bg-category-transport-bg/15 border-category-transport-bg/30",
      accentGlow: "hover:border-category-transport-bg/40",
      progressBar: {
        percent: stats.stockUtilizationPercent,
      },
    },
    {
      title: "Procurement Partners",
      value: stats.supplierCount.toLocaleString(),
      subtitle: "Active vendors & supply channels",
      icon: Truck,
      iconColor: "text-amber-600 bg-amber-500/15 border-amber-500/30",
      accentGlow: "hover:border-amber-500/40",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 shrink-0">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={cn(
              "p-4 rounded-xl border border-border bg-card shadow-xs transition-all duration-200 flex flex-col justify-between group",
              card.accentGlow
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                  {card.title}
                </span>
                <span className="text-xl md:text-2xl font-bold text-text tracking-tight block">
                  {card.value}
                </span>
              </div>
              <span
                className={cn(
                  "p-2 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-105",
                  card.iconColor
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </span>
            </div>

            {card.progressBar ? (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-text-secondary">
                  <span>{card.subtitle}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-bg-subtle overflow-hidden border border-border/50">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      card.progressBar.percent > 20
                        ? "bg-category-transport-bg"
                        : card.progressBar.percent > 0
                        ? "bg-amber-500"
                        : "bg-status-retired-bg"
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, card.progressBar.percent))}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] font-medium text-text-secondary mt-3 truncate">
                {card.subtitle}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
