"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type { UserAccount } from "@/components/users/types";
import {
  toUserAccount,
  usersApi,
  type CreateUserPayload,
  type MeProfile,
  type UpdateUserPayload,
} from "@/features/users/client/users-api";
import { userQueryKeys } from "@/features/users/client/query-keys";

export function useMeQuery(): UseQueryResult<MeProfile, Error> {
  return useQuery({
    queryKey: userQueryKeys.me(),
    queryFn: () => usersApi.getMe(),
  });
}

export function useUsersQuery(): UseQueryResult<UserAccount[], Error> {
  return useQuery({
    queryKey: userQueryKeys.list(),
    queryFn: async () => {
      const profiles = await usersApi.listUsers();
      return profiles.map(toUserAccount);
    },
  });
}

export function useCreateUserMutation(): UseMutationResult<
  UserAccount,
  Error,
  CreateUserPayload
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const created = await usersApi.createUser(payload);
      return toUserAccount(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
    },
  });
}

export function useUpdateUserMutation(): UseMutationResult<
  UserAccount,
  Error,
  { id: string; payload: UpdateUserPayload }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const updated = await usersApi.updateUser(id, payload);
      return toUserAccount(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
    },
  });
}

export function useDeactivateUserMutation(): UseMutationResult<
  UserAccount,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const updated = await usersApi.deactivateUser(id);
      return toUserAccount(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
    },
  });
}
