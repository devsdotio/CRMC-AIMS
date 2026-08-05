import type {
	Asset,
	AssetCategory,
	AssetStatus,
	MaintenanceLogEntry,
} from "@/components/assets/types";

export type { Asset, AssetCategory, AssetStatus, MaintenanceLogEntry };

export type CreateAssetInput = Pick<
	Asset,
	"assetCode" | "name" | "category" | "status" | "location"
> &
	Partial<
		Pick<
			Asset,
			| "serialNumber"
			| "currentHolder"
			| "department"
			| "purchaseDate"
			| "value"
			| "imageUrl"
			| "notes"
		>
	>;

export type UpdateAssetInput = Partial<CreateAssetInput>;

export type ReturnAssetInput = {
	condition: string;
	status?: AssetStatus;
};
