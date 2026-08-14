"use client";

import { useState } from "react";
import type { SettingsSection, CategoryItem, UserProfile } from "@/types/settings";
import { SettingsNav } from "@/components/settings/settings-nav";
import { AccountSection } from "@/components/settings/account-section";
import { CategoriesSection } from "@/components/settings/categories-section";

import { useCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } from "@/features/categories/client/use-categories";
import { QueryErrorBanner } from "@/components/shared/query-error-banner";
import { useToast } from "@/components/providers/toast-context";

// ── Mock Current User (Admin) ───────────────────────────────────────────
const MOCK_PROFILE: UserProfile = {
  id: "usr-001",
  name: "Dave Custodio",
  email: "d.custodio@crmc.gov.ph",
  role: "admin",
  department: "Property Custodian Office",
};

// ── Mock Category Data ──────────────────────────────────────────────────
const INITIAL_ASSET_CATEGORIES: CategoryItem[] = [
  { id: "cat-a1", name: "Computing", type: "asset", colorToken: "computing", itemCount: 24 },
  { id: "cat-a2", name: "AV Equipment", type: "asset", colorToken: "av", itemCount: 18 },
  { id: "cat-a3", name: "Transport", type: "asset", colorToken: "transport", itemCount: 6 },
  { id: "cat-a4", name: "Furniture", type: "asset", colorToken: "furniture", itemCount: 35 },
];

const INITIAL_CONSUMABLE_CATEGORIES: CategoryItem[] = [
  { id: "cat-c1", name: "Paper & Printing Supplies", type: "consumable", itemCount: 8 },
  { id: "cat-c2", name: "Ink & Toner Cartridges", type: "consumable", itemCount: 4 },
  { id: "cat-c3", name: "Cleaning & Sanitation", type: "consumable", itemCount: 12 },
  { id: "cat-c4", name: "Office Stationery", type: "consumable", itemCount: 7 },
];


export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [profile, setProfile] = useState<UserProfile>(MOCK_PROFILE);

  // Don't hit /api/categories until the Categories section opens.
  const {
    data: allCategories,
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: categoriesErr,
    refetch: refetchCategories,
  } = useCategoriesQuery({
    enabled: activeSection === "categories",
  });
  const createCategoryMutation = useCreateCategoryMutation();
  const updateCategoryMutation = useUpdateCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();
  const toast = useToast();

  const assetCategories = allCategories?.filter((c) => c.type === "asset") || [];
  const consumableCategories =
    allCategories?.filter((c) => c.type === "consumable") || [];

  // ── Section-level Page Title Map ───────────────────────────────────────
  const sectionMeta: Record<SettingsSection, { title: string; description: string }> = {
    account: {
      title: "Account Profile",
      description: "Update your personal staff details and security password",
    },
    categories: {
      title: "Category Management",
      description: "Configure asset and supply categories used throughout the system",
    },
  };

  const currentMeta = sectionMeta[activeSection];

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSaveProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  const handleSaveCategory = async (categoryData: Partial<CategoryItem>) => {
    try {
      if (categoryData.id && !categoryData.id.startsWith("cat-")) {
        // If ID does not start with cat- (temporary ID from dialog), it's an existing category from backend
        await updateCategoryMutation.mutateAsync(categoryData);
        toast.success("Category updated.");
      } else {
        await createCategoryMutation.mutateAsync(categoryData);
        toast.success("Category created.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save category.");
    }
  };

  const handleDeleteCategory = async (category: CategoryItem) => {
    if (category.itemCount > 0) return; // Safety guard — UI prevents this but double-checked here
    try {
      await deleteCategoryMutation.mutateAsync(category.id);
      toast.success("Category deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete category.");
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle rounded-md" data-theme="light">
      {/* ── Page Header Banner ─────────────────────────────────────────── */}
      <div className="px-4 md:px-6 pt-5 pb-3 bg-bg shrink-0 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-text">Settings</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          {currentMeta.description}
        </p>
      </div>

      {/* ── Main Body: Settings Nav + Active Section ───────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Settings Sidebar Nav */}
        <SettingsNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          userRole={profile.role}
        />

        {/* Active Section Content (internally scrollable) */}
        <main className="flex-1 overflow-y-auto min-h-0 p-4 md:p-8 bg-bg-subtle">
          <div className="mb-6">
            <h2 className="text-base font-bold text-text">{currentMeta.title}</h2>
            <p className="text-xs text-text-secondary mt-0.5">{currentMeta.description}</p>
          </div>

          {activeSection === "account" && (
            <AccountSection
              profile={profile}
              onSaveProfile={handleSaveProfile}
            />
          )}

          {activeSection === "categories" && profile.role === "admin" && (
            <>
              {categoriesError && (
                <QueryErrorBanner
                  message={
                    categoriesErr?.message || "Failed to load categories."
                  }
                  onRetry={() => void refetchCategories()}
                />
              )}
              {categoriesLoading && !allCategories ? (
                <p className="text-xs text-text-secondary">Loading categories…</p>
              ) : (
                <CategoriesSection
                  assetCategories={assetCategories}
                  consumableCategories={consumableCategories}
                  onSaveCategory={handleSaveCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              )}
            </>
          )}


        </main>
      </div>
    </div>
  );
}
