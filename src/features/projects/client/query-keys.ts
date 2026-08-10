export const projectQueryKeys = {
  all: ["projects"] as const,
  list: (filters?: { search?: string; status?: string }) =>
    [...projectQueryKeys.all, "list", filters ?? {}] as const,
  detail: (id: string) => [...projectQueryKeys.all, "detail", id] as const,
};
