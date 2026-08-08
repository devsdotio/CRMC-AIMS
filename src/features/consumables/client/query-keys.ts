export const consumableQueryKeys = {
  all: ["consumables"] as const,
  lists: () => [...consumableQueryKeys.all, "list"] as const,
  list: (filters?: {
    category?: string;
    stockLevel?: string;
    search?: string;
  }) => [...consumableQueryKeys.lists(), filters ?? {}] as const,
  detail: (id: string) => [...consumableQueryKeys.all, "detail", id] as const,
};
