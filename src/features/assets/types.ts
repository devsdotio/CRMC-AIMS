import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { assets } from "@/features/assets/schema";

export type Asset = InferSelectModel<typeof assets>;
export type NewAsset = InferInsertModel<typeof assets>;
export type AssetStatus = Asset["status"];

export type CreateAssetInput = {
	code: string;
	name: string;
	category: string;
	condition: string;
	status?: AssetStatus;
};

export type UpdateAssetInput = Partial<CreateAssetInput>;

export type ReleaseAssetInput = {
	expectedReturnAt?: string;
	borrowerName?: string;
};

export type ReturnAssetInput = {
	condition: string;
	status?: Exclude<AssetStatus, "borrowed">;
};
