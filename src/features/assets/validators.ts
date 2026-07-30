import type {
  AssetStatus,
  CreateAssetInput,
  ReturnAssetInput,
  UpdateAssetInput,
} from "@/features/assets/types";
import { ValidationError } from "@/features/assets/errors";

const allowedStatuses: AssetStatus[] = ["available", "borrowed", "under_repair"];

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

  const status = input.status === undefined ? "available" : parseStatus(input.status);

  return {
    code: requireNonEmptyString(input.code, "code"),
    name: requireNonEmptyString(input.name, "name"),
    category: requireNonEmptyString(input.category, "category"),
    condition: requireNonEmptyString(input.condition, "condition"),
    status,
  };
}

export function parseUpdateAssetInput(input: unknown): UpdateAssetInput {
  if (!isRecord(input)) {
    throw new ValidationError("Request body must be an object.");
  }

  const payload: UpdateAssetInput = {
    code: input.code === undefined ? undefined : requireNonEmptyString(input.code, "code"),
    name: input.name === undefined ? undefined : requireNonEmptyString(input.name, "name"),
    category:
      input.category === undefined
        ? undefined
        : requireNonEmptyString(input.category, "category"),
    condition:
      input.condition === undefined
        ? undefined
        : requireNonEmptyString(input.condition, "condition"),
    status: input.status === undefined ? undefined : parseStatus(input.status),
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

    if (parsedStatus === "borrowed") {
      throw new ValidationError("status is invalid for return.");
    }

    status = parsedStatus;
  }

  return {
    condition: requireNonEmptyString(input.condition, "condition"),
    status,
  };
}
