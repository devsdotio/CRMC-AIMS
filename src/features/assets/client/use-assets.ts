"use client";

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
} from "@/types/assets";

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
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Surface timeouts quickly — default multi-retry looked like infinite skeleton
    retry: 0,
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
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });
}

export function useCreateAssetMutation(): UseMutationResult<Asset, Error, CreateAssetInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => assetsApi.createAsset(payload),
    onMutate: async (newAsset) => {
      await queryClient.cancelQueries({ queryKey: assetQueryKeys.list() });

      const previousAssets = queryClient.getQueryData<Asset[]>(assetQueryKeys.list());

      const optimisticAsset: Asset = {
        id: `temp-${Date.now()}`,
        assetCode: newAsset.assetCode || `TEMP-${Date.now()}`,
        name: newAsset.name || "New Asset",
        category: newAsset.category || "",
        status: newAsset.status || "active",
        assignmentType: newAsset.assignmentType || "borrowable",
        serialNumber: newAsset.serialNumber,
        location: newAsset.location || "Unknown",
        department: newAsset.department,
        purchaseDate: newAsset.purchaseDate,
        value: newAsset.value,
        notes: newAsset.notes,
        lastUpdated: new Date().toISOString(),
        maintenanceHistory: [],
      };

      queryClient.setQueryData<Asset[]>(assetQueryKeys.list(), (old) => {
        return old ? [...old, optimisticAsset] : [optimisticAsset];
      });

      return { previousAssets };
    },
    onError: (err, newAsset, context) => {
      if (context?.previousAssets) {
        queryClient.setQueryData(assetQueryKeys.list(), context.previousAssets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.all });
    },
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
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: assetQueryKeys.list() });
      await queryClient.cancelQueries({ queryKey: assetQueryKeys.detail(id) });

      const previousAssets = queryClient.getQueryData<Asset[]>(assetQueryKeys.list());
      const previousAsset = queryClient.getQueryData<Asset>(assetQueryKeys.detail(id));

      if (previousAssets) {
        queryClient.setQueryData<Asset[]>(assetQueryKeys.list(), (old) => {
          if (!old) return old;
          return old.map((asset) =>
            asset.id === id ? { ...asset, ...payload, lastUpdated: new Date().toISOString() } : asset
          );
        });
      }

      if (previousAsset) {
        queryClient.setQueryData<Asset>(assetQueryKeys.detail(id), {
          ...previousAsset,
          ...payload,
          lastUpdated: new Date().toISOString(),
        });
      }

      return { previousAssets, previousAsset };
    },
    onError: (err, variables, context) => {
      if (context?.previousAssets) {
        queryClient.setQueryData(assetQueryKeys.list(), context.previousAssets);
      }
      if (context?.previousAsset) {
        queryClient.setQueryData(assetQueryKeys.detail(variables.id), context.previousAsset);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.detail(variables.id) });
    },
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
