"use client";

import { useState } from "react";
import type { SettingsSection, CategoryItem, UserProfile } from "@/types/settings";
import { SettingsNav } from "@/components/settings/settings-nav";
import { AccountSection } from "@/components/settings/account-section";
import { CategoriesSection } from "@/components/settings/categories-section";

import { useCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } from "@/features/categories/client/use-categories";
import {
  useChangePasswordMutation,
  useMeQuery,
  useUpdateMeMutation,
} from "@/features/users/client/use-users";
import { QueryErrorBanner } from "@/components/shared/query-error-banner";
import { useToast } from "@/components/providers/toast-context";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const {
    data: me,
    isLoading: meLoading,
    isError: meError,
    error: meErr,
    refetch: refetchMe,
  } = useMeQuery();
  const updateMeMutation = useUpdateMeMutation();
  const changePasswordMutation = useChangePasswordMutation();

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

  const profile: UserProfile | null = me
    ? {
        id: me.id,
        name: me.name,
        email: me.email,
        role: me.role,
        department: me.department ?? "",
      }
    : null;

  const assetCategories = allCategories?.filter((c) => c.type === "asset") || [];
  const consumableCategories =
    allCategories?.filter((c) => c.type === "consumable") || [];

  const canManageCategories =
    profile?.role === "admin" || profile?.role === "superadmin";

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

  const handleSaveProfile = async (updated: Partial<UserProfile>) => {
    await updateMeMutation.mutateAsync({
      name: updated.name,
      department: updated.department,
    });
    toast.success("Profile updated.");
  };

  const handleChangePassword = async (payload: {
    currentPassword: string;
    newPassword: string;
  }) => {
    await changePasswordMutation.mutateAsync(payload);
    toast.success("Password updated.");
  };

  const handleSaveCategory = async (categoryData: Partial<CategoryItem>) => {
    try {
      if (categoryData.id && !categoryData.id.startsWith("cat-")) {
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
    if (category.itemCount > 0) return;
    try {
      await deleteCategoryMutation.mutateAsync(category.id);
      toast.success("Category deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete category.");
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle rounded-md" data-theme="light">
      <div className="px-4 md:px-6 pt-5 pb-3 bg-bg shrink-0 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-text">Settings</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          {currentMeta.description}
        </p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        <SettingsNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          userRole={profile?.role ?? "staff"}
        />

        <main className="flex-1 overflow-y-auto min-h-0 p-4 md:p-8 bg-bg-subtle">
          <div className="mb-6">
            <h2 className="text-base font-bold text-text">{currentMeta.title}</h2>
            <p className="text-xs text-text-secondary mt-0.5">{currentMeta.description}</p>
          </div>

          {activeSection === "account" && (
            <>
              {meError && (
                <QueryErrorBanner
                  message={meErr?.message || "Failed to load your profile."}
                  onRetry={() => void refetchMe()}
                />
              )}
              {meLoading && !profile ? (
                <p className="text-xs text-text-secondary">Loading profile…</p>
              ) : profile ? (
                <AccountSection
                  profile={profile}
                  savingProfile={updateMeMutation.isPending}
                  savingPassword={changePasswordMutation.isPending}
                  onSaveProfile={handleSaveProfile}
                  onChangePassword={handleChangePassword}
                />
              ) : null}
            </>
          )}

          {activeSection === "categories" && canManageCategories && (
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
