/**
 * Assets client data layer — prepared for UI integration, not wired yet.
 *
 * Usage (when you integrate `/assets`):
 * ```tsx
 * const { data: assets, isLoading, error } = useAssetsQuery();
 * const createAsset = useCreateAssetMutation();
 * ```
 *
 * Requires:
 * - `QueryProvider` in root layout (already present)
 * - Authenticated session (API returns 401 without one)
 */

export { assetsApi } from "./assets-api";
export { assetQueryKeys } from "./query-keys";
export {
  useAssetQuery,
  useAssetsQuery,
  useCreateAssetMutation,
  useDeleteAssetMutation,
  useReleaseAssetMutation,
  useReturnAssetMutation,
  useUpdateAssetMutation,
} from "./use-assets";
