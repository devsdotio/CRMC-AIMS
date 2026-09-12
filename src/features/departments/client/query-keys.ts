export const departmentQueryKeys = {
  all: ["departments"] as const,
  list: (includeSandbox?: boolean) =>
    [...departmentQueryKeys.all, "list", { includeSandbox }] as const,
};
