import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { categories } from "@/server/db/schema";
import { requireActor } from "@/server/shared/auth";

/**
 * Institutional category taxonomy (Settings).
 * Lists all asset + consumable categories for the org (not only creator).
 */
export async function GET(request: Request) {
  try {
    await requireActor();
    const db = getDb();
    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    const rows =
      type === "asset" || type === "consumable"
        ? await db
            .select()
            .from(categories)
            .where(eq(categories.type, type))
            .orderBy(categories.name)
        : await db.select().from(categories).orderBy(categories.name);

    const mappedCategories = rows.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type as "asset" | "consumable",
      colorToken: c.colorToken || undefined,
      itemCount: 0,
    }));

    return NextResponse.json({ data: mappedCategories });
  } catch (error) {
    console.error("GET /api/categories Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    const db = getDb();
    const body = await request.json();

    if (!body.name?.trim() || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields: name, type" },
        { status: 400 }
      );
    }

    if (body.type !== "asset" && body.type !== "consumable") {
      return NextResponse.json(
        { error: "type must be asset or consumable" },
        { status: 400 }
      );
    }

    const name = String(body.name).trim();

    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.type, body.type),
          sql`lower(${categories.name}) = lower(${name})`
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: `Category “${name}” already exists for this type.` },
        { status: 409 }
      );
    }

    const [newCategory] = await db
      .insert(categories)
      .values({
        name,
        description: body.description || null,
        type: body.type,
        colorToken: body.colorToken || null,
        createdByUserId: actor.userId,
      })
      .returning();

    return NextResponse.json(
      {
        data: {
          id: newCategory.id,
          name: newCategory.name,
          type: newCategory.type,
          colorToken: newCategory.colorToken || undefined,
          itemCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/categories Error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
