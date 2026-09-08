/**
 * Borrow log client data layer — prepared for UI integration, not wired yet.
 */

export { borrowLogApi } from "./borrow-log-api";
export type {
  BorrowLogRecord,
  ReleaseBorrowPayload,
  ReturnBorrowPayload,
  VoidBorrowPayload,
} from "./borrow-log-api";
export { borrowLogQueryKeys } from "./query-keys";
export {
  useBorrowLogQuery,
  useBorrowLogRecordQuery,
  useReleaseBorrowMutation,
  useReturnBorrowMutation,
  useVoidBorrowMutation,
} from "./use-borrow-log";
