/**
 * Borrow log client data layer — prepared for UI integration, not wired yet.
 */

export { borrowLogApi } from "./borrow-log-api";
export type {
  BorrowLogRecord,
  ReleaseBorrowPayload,
  ReturnBorrowPayload,
} from "./borrow-log-api";
export { borrowLogQueryKeys } from "./query-keys";
export {
  useBorrowLogQuery,
  useBorrowLogRecordQuery,
  useReleaseBorrowMutation,
  useReturnBorrowMutation,
} from "./use-borrow-log";
