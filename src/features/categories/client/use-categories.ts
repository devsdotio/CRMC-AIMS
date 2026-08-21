"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { CategoryItem } from "@/types/settings";
import { fetchJson, type ApiResponse } from "@/features/shared/fetch-json";
import { categoryQueryKeys } from "./query-keys";

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
    queryKey: categoryQueryKeys.list(),
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
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
      await queryClient.cancelQueries({ queryKey: categoryQueryKeys.all });
      const previousCategories = queryClient.getQueryData<CategoryItem[]>(categoryQueryKeys.list());

      if (previousCategories) {
        queryClient.setQueryData<CategoryItem[]>(categoryQueryKeys.list(), [
          ...previousCategories,
          { ...newCategory, id: newCategory.id || `temp-${Date.now()}` } as CategoryItem
        ]);
      }
      return { previousCategories };
    },
    onError: (_err, _newCategory, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(
          categoryQueryKeys.list(),
          context.previousCategories
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
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
      await queryClient.cancelQueries({ queryKey: categoryQueryKeys.all });
      const previousCategories = queryClient.getQueryData<CategoryItem[]>(categoryQueryKeys.list());

      if (previousCategories) {
        queryClient.setQueryData<CategoryItem[]>(
          categoryQueryKeys.list(),
          previousCategories.map((cat) =>
            cat.id === updatedCategory.id ? { ...cat, ...updatedCategory } : cat
          )
        );
      }
      return { previousCategories };
    },
    onError: (_err, _updatedCategory, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(
          categoryQueryKeys.list(),
          context.previousCategories
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
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
      await queryClient.cancelQueries({ queryKey: categoryQueryKeys.all });
      const previousCategories = queryClient.getQueryData<CategoryItem[]>(categoryQueryKeys.list());

      if (previousCategories) {
        queryClient.setQueryData<CategoryItem[]>(
          categoryQueryKeys.list(),
          previousCategories.filter((cat) => cat.id !== deletedId)
        );
      }
      return { previousCategories };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(
          categoryQueryKeys.list(),
          context.previousCategories
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
    },
  });
}
