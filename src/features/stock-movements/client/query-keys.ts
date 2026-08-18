export const stockMovementQueryKeys = {
  all: ["stock-movements"] as const,
  lists: () => [...stockMovementQueryKeys.all, "list"] as const,
  list: (filters?: { reason?: string; limit?: number }) =>
    [...stockMovementQueryKeys.lists(), filters ?? {}] as const,
  byConsumable: (id: string) =>
    [...stockMovementQueryKeys.all, "consumable", id] as const,
};
