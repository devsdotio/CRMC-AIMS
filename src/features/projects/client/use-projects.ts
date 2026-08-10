"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type { Project, ProjectExpenseLine } from "@/types/projects";
import {
  projectsApi,
  type CreateProjectExpensePayload,
  type CreateProjectPayload,
  type UpdateProjectExpensePayload,
  type UpdateProjectPayload,
} from "./projects-api";
import { projectQueryKeys } from "./query-keys";

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
    onSuccess: () => invalidateProjects(queryClient),
  });
}
