"use server";

import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { assets } from "@/features/assets/schema";
import type {
  AssetStatus,
  CreateAssetInput,
  UpdateAssetInput,
} from "@/features/assets/types";

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

function normalizeOptionalStatus(status: unknown): AssetStatus | undefined {
  if (status === undefined) {
    return undefined;
  }

  return normalizeStatus(status);
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

export async function updateAsset(id: string, input: UpdateAssetInput) {
  const normalizedId = requireNonEmptyString(id, "id");

  const payload = {
    code: input.code === undefined ? undefined : requireNonEmptyString(input.code, "code"),
    name: input.name === undefined ? undefined : requireNonEmptyString(input.name, "name"),
    category:
      input.category === undefined ? undefined : requireNonEmptyString(input.category, "category"),
    condition:
      input.condition === undefined
        ? undefined
        : requireNonEmptyString(input.condition, "condition"),
    status: normalizeOptionalStatus(input.status),
  };

  const hasUpdateField = Object.values(payload).some((value) => value !== undefined);

  if (!hasUpdateField) {
    throw new Error("VALIDATION:At least one field must be provided for update.");
  }

  const db = getDb();
  const [updatedAsset] = await db
    .update(assets)
    .set(payload)
    .where(eq(assets.id, normalizedId))
    .returning();

  return updatedAsset ?? null;
}

export async function deleteAsset(id: string) {
  const normalizedId = requireNonEmptyString(id, "id");
  const db = getDb();

  const [deletedAsset] = await db
    .delete(assets)
    .where(eq(assets.id, normalizedId))
    .returning({ id: assets.id });

  return Boolean(deletedAsset);
}

export async function releaseAsset(id: string) {
  const normalizedId = requireNonEmptyString(id, "id");
  const db = getDb();
  const [existingAsset] = await db
    .select({ id: assets.id, status: assets.status })
    .from(assets)
    .where(eq(assets.id, normalizedId))
    .limit(1);

  if (!existingAsset) {
    return null;
  }

  if (existingAsset.status !== "available") {
    throw new Error("CONFLICT:Asset is not available for release.");
  }

  const [updatedAsset] = await db
    .update(assets)
    .set({ status: "borrowed" })
    .where(eq(assets.id, normalizedId))
    .returning();

  return updatedAsset ?? null;
}

export async function returnAsset(
  id: string,
  input: { condition: string; status?: Exclude<AssetStatus, "borrowed"> }
) {
  const normalizedId = requireNonEmptyString(id, "id");
  const condition = requireNonEmptyString(input?.condition, "condition");
  const nextStatus = input?.status ?? "available";

  if (nextStatus !== "available" && nextStatus !== "under_repair") {
    throw new Error("VALIDATION:status is invalid for return.");
  }

  const db = getDb();
  const [existingAsset] = await db
    .select({ id: assets.id, status: assets.status })
    .from(assets)
    .where(eq(assets.id, normalizedId))
    .limit(1);

  if (!existingAsset) {
    return null;
  }

  if (existingAsset.status !== "borrowed") {
    throw new Error("CONFLICT:Only borrowed assets can be returned.");
  }

  const [updatedAsset] = await db
    .update(assets)
    .set({ condition, status: nextStatus })
    .where(eq(assets.id, normalizedId))
    .returning();

  return updatedAsset ?? null;
}
