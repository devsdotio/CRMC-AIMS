import type {
  AssetStatus,
  CreateAssetInput,
  ReturnAssetInput,
  UpdateAssetInput,
} from "@/features/assets/types";
import { ValidationError } from "@/features/assets/errors";

const allowedStatuses: AssetStatus[] = [
  "active",
  "needs_repair",
  "out_of_service",
  "retired",
];
const allowedCategories = ["transport", "computing", "av", "furniture"] as const;
type AssetCategoryInput = (typeof allowedCategories)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} is required.`);
  }

  return value.trim();
}

function parseStatus(value: unknown, fieldName = "status"): AssetStatus {
  if (typeof value !== "string" || !allowedStatuses.includes(value as AssetStatus)) {
    throw new ValidationError(`${fieldName} is invalid.`);
  }

  return value as AssetStatus;
}

function parseCategory(value: unknown, fieldName = "category"): AssetCategoryInput {
  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} is invalid.`);
  }

  const normalized = value.trim().toLowerCase();
  if (!allowedCategories.includes(normalized as AssetCategoryInput)) {
    throw new ValidationError(`${fieldName} is invalid.`);
  }

  return normalized as AssetCategoryInput;
}

function parseOptionalString(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ValidationError("Optional text fields must be strings.");
  }

  const normalized = value.trim();
  return normalized.length === 0 ? undefined : normalized;
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ValidationError("value must be a number.");
  }

  return value;
}

export function parseAssetId(id: unknown): string {
  return requireNonEmptyString(id, "id");
}

export function parseAssetListStatusQuery(value: string | null): AssetStatus | undefined {
  if (value === null || value.trim().length === 0) {
    return undefined;
  }

  return parseStatus(value, "status query");
}

export function parseCreateAssetInput(input: unknown): CreateAssetInput {
  if (!isRecord(input)) {
    throw new ValidationError("Request body must be an object.");
  }

  const status = input.status === undefined ? "active" : parseStatus(input.status);

  return {
    assetCode: requireNonEmptyString(input.assetCode, "assetCode"),
    name: requireNonEmptyString(input.name, "name"),
    category: parseCategory(input.category),
    status,
    location: requireNonEmptyString(input.location, "location"),
    serialNumber: parseOptionalString(input.serialNumber),
    currentHolder: parseOptionalString(input.currentHolder),
    department: parseOptionalString(input.department),
    purchaseDate: parseOptionalString(input.purchaseDate),
    value: parseOptionalNumber(input.value),
    imageUrl: parseOptionalString(input.imageUrl),
    notes: parseOptionalString(input.notes),
  };
}

export function parseUpdateAssetInput(input: unknown): UpdateAssetInput {
  if (!isRecord(input)) {
    throw new ValidationError("Request body must be an object.");
  }

  const payload: UpdateAssetInput = {
    assetCode:
      input.assetCode === undefined
        ? undefined
        : requireNonEmptyString(input.assetCode, "assetCode"),
    name: input.name === undefined ? undefined : requireNonEmptyString(input.name, "name"),
    category:
      input.category === undefined
        ? undefined
        : parseCategory(input.category),
    status: input.status === undefined ? undefined : parseStatus(input.status),
    location:
      input.location === undefined
        ? undefined
        : requireNonEmptyString(input.location, "location"),
    serialNumber: parseOptionalString(input.serialNumber),
    currentHolder: parseOptionalString(input.currentHolder),
    department: parseOptionalString(input.department),
    purchaseDate: parseOptionalString(input.purchaseDate),
    value: parseOptionalNumber(input.value),
    imageUrl: parseOptionalString(input.imageUrl),
    notes: parseOptionalString(input.notes),
  };

  const hasUpdateField = Object.values(payload).some((value) => value !== undefined);

  if (!hasUpdateField) {
    throw new ValidationError("At least one field must be provided for update.");
  }

  return payload;
}

export function parseReturnAssetInput(input: unknown): ReturnAssetInput {
  if (!isRecord(input)) {
    throw new ValidationError("Request body must be an object.");
  }

  const statusValue = input.status;
  let status: ReturnAssetInput["status"];

  if (statusValue !== undefined) {
    const parsedStatus = parseStatus(statusValue);

    status = parsedStatus;
  }

  return {
    condition: requireNonEmptyString(input.condition, "condition"),
    status,
  };
}
