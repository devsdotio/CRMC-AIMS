"use client";

import Link from "next/link";
import { MOCK_CATEGORY_DATA } from "@/features/dashboard/mock-data";

export default function CategoryDistribution() {
  return (
    <div className="bg-bg rounded-xl border border-border shadow-xs p-6 space-y-6">
      <div>
        <h3 className="text-base font-bold text-text">
          Category Distribution
        </h3>
        <p className="text-xs text-text-secondary">
          Overview of main asset classes.
        </p>
      </div>

      <div className="space-y-3.5">
        {MOCK_CATEGORY_DATA.map((cat) => (
          <div key={cat.category} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text">{cat.label}</span>
              <span className="text-text-secondary">{cat.count} items</span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-category-computing-bg"
                style={{ width: `${Math.min((cat.count / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border space-y-2">
        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Quick Shortcuts
        </h4>
        <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold">
          <Link
            href="/assets"
            className="p-2.5 bg-bg-subtle hover:bg-border rounded-lg transition-colors border border-border"
          >
            Browse Assets
          </Link>
          <Link
            href="/settings"
            className="p-2.5 bg-bg-subtle hover:bg-border rounded-lg transition-colors border border-border"
          >
            System Config
          </Link>
        </div>
      </div>
    </div>
  );
}
