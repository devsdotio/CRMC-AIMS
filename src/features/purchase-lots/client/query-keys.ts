export const purchaseLotQueryKeys = {
  all: ["purchase-lots"] as const,
  list: (filters?: Record<string, string | undefined>) =>
    [...purchaseLotQueryKeys.all, "list", filters ?? {}] as const,
};
