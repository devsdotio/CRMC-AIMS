"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { CategoryItem } from "@/types/settings";

type ApiResponse<T> = { data: T };

async function fetchCategories(): Promise<CategoryItem[]> {
  const response = await fetch("/api/categories");
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  const result = (await response.json()) as ApiResponse<CategoryItem[]>;
  return result.data;
}

async function createCategory(payload: Partial<CategoryItem>): Promise<CategoryItem> {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create category");
  const result = (await response.json()) as ApiResponse<CategoryItem>;
  return result.data;
}

async function updateCategory(payload: Partial<CategoryItem>): Promise<CategoryItem> {
  const response = await fetch(`/api/categories/${payload.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to update category");
  const result = (await response.json()) as ApiResponse<CategoryItem>;
  return result.data;
}

async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete category");
}

export function useCategoriesQuery(): UseQueryResult<CategoryItem[], Error> {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
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
    onError: (err, newCategory, context) => {
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
    onError: (err, updatedCategory, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories"], context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
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
    onError: (err, deletedId, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories"], context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
