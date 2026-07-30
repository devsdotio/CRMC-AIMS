"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type { Asset as UiAsset } from "@/components/assets/types";
import { mapBackendAssetToUiAsset } from "@/features/assets/client/adapters";
import { assetsApi } from "@/features/assets/client/assets-api";
import { assetQueryKeys } from "@/features/assets/client/query-keys";
import type {
  Asset,
  AssetStatus,
  CreateAssetInput,
  ReturnAssetInput,
  UpdateAssetInput,
} from "@/features/assets/types";

export function useAssetsQuery(status?: AssetStatus): UseQueryResult<Asset[], Error> {
  return useQuery({
    queryKey: assetQueryKeys.list(status),
    queryFn: () => assetsApi.listAssets(status),
  });
}

export function useAssetsUiQuery(status?: AssetStatus): UseQueryResult<UiAsset[], Error> {
  return useQuery({
    queryKey: assetQueryKeys.list(status),
    queryFn: () => assetsApi.listAssets(status),
    select: (assets) => assets.map(mapBackendAssetToUiAsset),
  });
}

export function useAssetQuery(id: string): UseQueryResult<Asset, Error> {
  return useQuery({
    queryKey: assetQueryKeys.detail(id),
    queryFn: () => assetsApi.getAssetById(id),
    enabled: Boolean(id),
  });
}

export function useCreateAssetMutation(): UseMutationResult<Asset, Error, CreateAssetInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => assetsApi.createAsset(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.all });
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
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.all });
      queryClient.setQueryData(assetQueryKeys.detail(asset.id), asset);
    },
  });
}

export function useDeleteAssetMutation(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => assetsApi.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.all });
    },
  });
}

export function useReleaseAssetMutation(): UseMutationResult<Asset, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => assetsApi.releaseAsset(id),
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.all });
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
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.all });
      queryClient.setQueryData(assetQueryKeys.detail(asset.id), asset);
    },
  });
}
