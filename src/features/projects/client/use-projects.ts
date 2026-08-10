"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type {
  Project,
  ProjectAssetAssignment,
  ProjectExpenseLine,
} from "@/types/projects";
import {
  projectsApi,
  type AssignProjectAssetPayload,
  type CreateProjectExpensePayload,
  type CreateProjectPayload,
  type ReturnProjectAssetPayload,
  type UpdateProjectExpensePayload,
  type UpdateProjectPayload,
  type UseProjectMaterialPayload,
} from "./projects-api";
import { projectQueryKeys } from "./query-keys";
import { consumableQueryKeys } from "@/features/consumables/client/query-keys";
import { assetQueryKeys } from "@/features/assets/client/query-keys";

function invalidateProjects(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: projectQueryKeys.all });
}

export function useProjectsQuery(): UseQueryResult<Project[], Error> {
  return useQuery({
    queryKey: projectQueryKeys.list(),
    queryFn: () => projectsApi.list(),
  });
}

export function useProjectExpensesQuery(
  projectId: string | null | undefined
): UseQueryResult<ProjectExpenseLine[], Error> {
  return useQuery({
    queryKey: projectQueryKeys.expenses(projectId ?? ""),
    queryFn: () => projectsApi.listExpenses(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useCreateProjectMutation(): UseMutationResult<
  Project,
  Error,
  CreateProjectPayload
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => projectsApi.create(payload),
    onSuccess: () => invalidateProjects(queryClient),
  });
}

export function useUpdateProjectMutation(): UseMutationResult<
  Project,
  Error,
  { id: string; payload: UpdateProjectPayload }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => projectsApi.update(id, payload),
    onSuccess: () => invalidateProjects(queryClient),
  });
}

export function useDeleteProjectMutation(): UseMutationResult<
  void,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => projectsApi.delete(id),
    onSuccess: () => invalidateProjects(queryClient),
  });
}

export function useCreateProjectExpenseMutation(): UseMutationResult<
  ProjectExpenseLine,
  Error,
  { projectId: string; payload: CreateProjectExpensePayload }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, payload }) =>
      projectsApi.createExpense(projectId, payload),
    onSuccess: () => invalidateProjects(queryClient),
  });
}

export function useProjectMaterialMutation(): UseMutationResult<
  ProjectExpenseLine,
  Error,
  { projectId: string; payload: UseProjectMaterialPayload }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, payload }) =>
      projectsApi.useMaterial(projectId, payload),
    onSuccess: () => {
      invalidateProjects(queryClient);
      // Stock changed — refresh inventory caches if present
      queryClient.invalidateQueries({ queryKey: consumableQueryKeys.all });
    },
  });
}

export function useUpdateProjectExpenseMutation(): UseMutationResult<
  ProjectExpenseLine,
  Error,
  {
    projectId: string;
    expenseId: string;
    payload: UpdateProjectExpensePayload;
  }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, expenseId, payload }) =>
      projectsApi.updateExpense(projectId, expenseId, payload),
    onSuccess: () => invalidateProjects(queryClient),
  });
}

export function useDeleteProjectExpenseMutation(): UseMutationResult<
  void,
  Error,
  { projectId: string; expenseId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, expenseId }) =>
      projectsApi.deleteExpense(projectId, expenseId),
    onSuccess: () => {
      invalidateProjects(queryClient);
      queryClient.invalidateQueries({ queryKey: consumableQueryKeys.all });
    },
  });
}

export function useProjectAssetsQuery(
  projectId: string | null | undefined,
  status?: "assigned" | "returned" | "written_off" | "all"
): UseQueryResult<ProjectAssetAssignment[], Error> {
  return useQuery({
    queryKey: projectQueryKeys.assets(projectId ?? "", status),
    queryFn: () => projectsApi.listAssets(projectId!, status),
    enabled: Boolean(projectId),
  });
}

export function useAssignProjectAssetMutation(): UseMutationResult<
  ProjectAssetAssignment,
  Error,
  { projectId: string } & AssignProjectAssetPayload
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, ...payload }) =>
      projectsApi.assignAsset(projectId, payload),
    onSuccess: () => {
      invalidateProjects(queryClient);
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.all });
    },
  });
}

export function useReturnProjectAssetMutation(): UseMutationResult<
  ProjectAssetAssignment,
  Error,
  { projectId: string; assignmentId: string } & ReturnProjectAssetPayload
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, assignmentId, notes }) =>
      projectsApi.returnAsset(projectId, assignmentId, { notes }),
    onSuccess: () => {
      invalidateProjects(queryClient);
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.all });
    },
  });
}
