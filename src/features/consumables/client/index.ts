/**
 * Consumables client data layer — prepared for UI integration, not wired yet.
 */

export { consumablesApi } from "./consumables-api";
export type {
  ConsumableItem,
  CreateConsumablePayload,
  RestockPayload,
  StockAdjustPayload,
  StockMovementPayload,
  UpdateConsumablePayload,
} from "./consumables-api";
export { consumableQueryKeys } from "./query-keys";
export {
  useAdjustConsumableMutation,
  useCheckoutConsumableMutation,
  useConsumableQuery,
  useConsumablesQuery,
  useCreateConsumableMutation,
  useRestockConsumableMutation,
  useUpdateConsumableMutation,
} from "./use-consumables";
