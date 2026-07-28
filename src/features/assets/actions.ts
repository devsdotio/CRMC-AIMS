"use server";

import { getDb } from "@/db";
import { assets } from "@/features/assets/schema";
import type { AssetStatus, CreateAssetInput } from "@/features/assets/types";

const allowedStatuses: AssetStatus[] = ["available", "borrowed", "under_repair"];

function requireNonEmptyString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`VALIDATION:${fieldName} is required.`);
  }

  return value.trim();
}

function normalizeStatus(status: unknown): AssetStatus {
  if (status === undefined) {
    return "available";
  }

  if (typeof status !== "string" || !allowedStatuses.includes(status as AssetStatus)) {
    throw new Error("VALIDATION:status is invalid.");
  }

  return status as AssetStatus;
}

export async function createAsset(input: CreateAssetInput) {
  const payload = {
    code: requireNonEmptyString(input?.code, "code"),
    name: requireNonEmptyString(input?.name, "name"),
    category: requireNonEmptyString(input?.category, "category"),
    condition: requireNonEmptyString(input?.condition, "condition"),
    status: normalizeStatus(input?.status),
  };

  const db = getDb();
  const [createdAsset] = await db.insert(assets).values(payload).returning();

  return createdAsset;
}
