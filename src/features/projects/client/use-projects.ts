"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type { Project } from "@/types/projects";
import {
  projectsApi,
  type CreateProjectPayload,
  type UpdateProjectPayload,
} from "./projects-api";
import { projectQueryKeys } from "./query-keys";

export function useProjectsQuery(): UseQueryResult<Project[], Error> {
  return useQuery({
    queryKey: projectQueryKeys.list(),
    queryFn: () => projectsApi.list(),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
}
