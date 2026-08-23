"use client";
import { useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { CategoryItem } from "@/types/settings";
import { fetchJson, type ApiResponse } from "@/features/shared/fetch-json";
import { getCategoryStyle, type CategoryStyleMeta } from "@/constants/categories";

async function fetchCategories(): Promise<CategoryItem[]> {
  const result = await fetchJson<ApiResponse<CategoryItem[]>>("/api/categories");
  return result.data;
}

async function createCategory(payload: Partial<CategoryItem>): Promise<CategoryItem> {
  const result = await fetchJson<ApiResponse<CategoryItem>>("/api/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return result.data;
}

async function updateCategory(payload: Partial<CategoryItem>): Promise<CategoryItem> {
  const result = await fetchJson<ApiResponse<CategoryItem>>(
    `/api/categories/${payload.id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
  return result.data;
}

async function deleteCategory(id: string): Promise<void> {
  await fetchJson(`/api/categories/${id}`, {
    method: "DELETE",
  });
}

export function useCategoriesQuery(options?: {
  enabled?: boolean;
}): UseQueryResult<CategoryItem[], Error> {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Returns a helper function that resolves CategoryStyleMeta using custom colors from Settings.
 */
export function useCategoryStyleMap() {
  const { data: categories = [] } = useCategoriesQuery();

  return useMemo(() => {
    const tokenMap = new Map<string, string>();
    for (const cat of categories) {
      if (cat.name && cat.colorToken) {
        tokenMap.set(cat.name.trim().toLowerCase(), cat.colorToken);
      }
    }

    return {
      categories,
      getCategoryStyle: (
        categoryName: string,
        fallbackLabel?: string
      ): CategoryStyleMeta => {
        const token = tokenMap.get((categoryName || "").trim().toLowerCase());
        return getCategoryStyle(categoryName, fallbackLabel, token);
      },
    };
  }, [categories]);
}

export function useCreateCategoryMutation(): UseMutationResult<
  CategoryItem,
  Error,
  Partial<CategoryItem>
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onMutate: async (newCategory) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });
      const previousCategories = queryClient.getQueryData<CategoryItem[]>(["categories"]);

      if (previousCategories) {
        queryClient.setQueryData<CategoryItem[]>(["categories"], [
          ...previousCategories,
          { ...newCategory, id: newCategory.id || `temp-${Date.now()}` } as CategoryItem
        ]);
      }
      return { previousCategories };
    },
    onError: (_err, _newCategory, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories"], context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategoryMutation(): UseMutationResult<
  CategoryItem,
  Error,
  Partial<CategoryItem>
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCategory,
    onMutate: async (updatedCategory) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });
      const previousCategories = queryClient.getQueryData<CategoryItem[]>(["categories"]);

      if (previousCategories) {
        queryClient.setQueryData<CategoryItem[]>(
          ["categories"],
          previousCategories.map((cat) =>
            cat.id === updatedCategory.id ? { ...cat, ...updatedCategory } : cat
          )
        );
      }
      return { previousCategories };
    },
    onError: (_err, _updatedCategory, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories"], context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset-models"] });
      queryClient.invalidateQueries({ queryKey: ["consumables"] });
      queryClient.invalidateQueries({ queryKey: ["borrow-requests"] });
      queryClient.invalidateQueries({ queryKey: ["consumable-requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] });
    },
  });
}

export function useDeleteCategoryMutation(): UseMutationResult<
  void,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });
      const previousCategories = queryClient.getQueryData<CategoryItem[]>(["categories"]);

      if (previousCategories) {
        queryClient.setQueryData<CategoryItem[]>(
          ["categories"],
          previousCategories.filter((cat) => cat.id !== deletedId)
        );
      }
      return { previousCategories };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories"], context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset-models"] });
      queryClient.invalidateQueries({ queryKey: ["consumables"] });
      queryClient.invalidateQueries({ queryKey: ["borrow-requests"] });
      queryClient.invalidateQueries({ queryKey: ["consumable-requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] });
    },
  });
}
