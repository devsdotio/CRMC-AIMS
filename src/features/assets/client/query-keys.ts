import type { AssetStatus } from "@/types/assets";

export const assetQueryKeys = {
  all: ["assets"] as const,
  list: (status?: AssetStatus) => [...assetQueryKeys.all, "list", { status }] as const,
  detail: (id: string) => [...assetQueryKeys.all, "detail", id] as const,
};
