/**
 * Assets client data layer — prepared for UI integration, not wired yet.
 *
 * Includes lifecycle ledger reads and accountable mutations (actor = session).
 */

export {
  assetsApi,
  type AssetLifecycleEvent,
  type FlagMaintenanceInput,
  type ReleaseAssetInput,
} from "./assets-api";
export { assetQueryKeys } from "./query-keys";
export {
  useAssetLifecycleQuery,
  useAssetQuery,
  useAssetsQuery,
  useCreateAssetMutation,
  useDeleteAssetMutation,
  useFlagMaintenanceMutation,
  useReleaseAssetMutation,
  useReturnAssetMutation,
  useUpdateAssetMutation,
} from "./use-assets";
