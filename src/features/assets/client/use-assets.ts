"use client";

/**
 * React Query hooks for the Assets API + lifecycle ledger.
 * Ready for integration — the assets page still uses mock data until wired.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  assetsApi,
  type AssetLifecycleEvent,
  type FlagMaintenanceInput,
  type ReleaseAssetInput,
} from "@/features/assets/client/assets-api";
import { assetQueryKeys } from "@/features/assets/client/query-keys";
import type {
  Asset,
  AssetStatus,
  CreateAssetInput,
  ReturnAssetInput,
  UpdateAssetInput,
} from "@/features/assets/types";

function invalidateAssetCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  assetId?: string
) {
  queryClient.invalidateQueries({ queryKey: assetQueryKeys.all });
  if (assetId) {
    queryClient.invalidateQueries({ queryKey: assetQueryKeys.lifecycle(assetId) });
  }
}

export function useAssetsQuery(status?: AssetStatus): UseQueryResult<Asset[], Error> {
  return useQuery({
    queryKey: assetQueryKeys.list(status),
    queryFn: () => assetsApi.listAssets(status),
  });
}

export function useAssetQuery(id: string): UseQueryResult<Asset, Error> {
  return useQuery({
    queryKey: assetQueryKeys.detail(id),
    queryFn: () => assetsApi.getAssetById(id),
    enabled: Boolean(id),
  });
}

export function useAssetLifecycleQuery(
  id: string,
  limit?: number
): UseQueryResult<AssetLifecycleEvent[], Error> {
  return useQuery({
    queryKey: assetQueryKeys.lifecycle(id),
    queryFn: () => assetsApi.listLifecycle(id, limit),
    enabled: Boolean(id),
  });
}

export function useCreateAssetMutation(): UseMutationResult<Asset, Error, CreateAssetInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => assetsApi.createAsset(payload),
    onSuccess: (asset) => {
      invalidateAssetCaches(queryClient, asset.id);
    },
  });
}

export function useUpdateAssetMutation(): UseMutationResult<
  Asset,
  Error,
  { id: string; payload: UpdateAssetInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => assetsApi.updateAsset(id, payload),
    onSuccess: (asset) => {
      invalidateAssetCaches(queryClient, asset.id);
      queryClient.setQueryData(assetQueryKeys.detail(asset.id), asset);
    },
  });
}

export function useDeleteAssetMutation(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => assetsApi.deleteAsset(id),
    onSuccess: (_void, id) => {
      invalidateAssetCaches(queryClient, id);
    },
  });
}

export function useReleaseAssetMutation(): UseMutationResult<
  Asset,
  Error,
  { id: string; payload: ReleaseAssetInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => assetsApi.releaseAsset(id, payload),
    onSuccess: (asset) => {
      invalidateAssetCaches(queryClient, asset.id);
      queryClient.setQueryData(assetQueryKeys.detail(asset.id), asset);
    },
  });
}

export function useReturnAssetMutation(): UseMutationResult<
  Asset,
  Error,
  { id: string; payload: ReturnAssetInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => assetsApi.returnAsset(id, payload),
    onSuccess: (asset) => {
      invalidateAssetCaches(queryClient, asset.id);
      queryClient.setQueryData(assetQueryKeys.detail(asset.id), asset);
    },
  });
}

export function useFlagMaintenanceMutation(): UseMutationResult<
  Asset,
  Error,
  { id: string; payload?: FlagMaintenanceInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => assetsApi.flagForMaintenance(id, payload),
    onSuccess: (asset) => {
      invalidateAssetCaches(queryClient, asset.id);
      queryClient.setQueryData(assetQueryKeys.detail(asset.id), asset);
    },
  });
}
