import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { categories } from "@/server/db/schema";
import { requireActor } from "@/server/shared/auth";

export async function GET(request: Request) {
  try {
    const actor = await requireActor();
    const db = getDb();
    
    // Fetch categories created by the current user
    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.createdByUserId, actor.userId));
      
    // Transform to match CategoryItem interface
    const mappedCategories = userCategories.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      colorToken: c.colorToken || undefined,
      itemCount: 0, // Mocked item count for now
    }));
    
    return NextResponse.json({ data: mappedCategories });
  } catch (error) {
    console.error("GET /api/categories Error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    const db = getDb();
    const body = await request.json();
    
    if (!body.name || !body.type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const [newCategory] = await db
      .insert(categories)
      .values({
        name: body.name,
        description: body.description || null,
        type: body.type,
        colorToken: body.colorToken || null,
        createdByUserId: actor.userId,
      })
      .returning();
      
    return NextResponse.json({
      data: {
        id: newCategory.id,
        name: newCategory.name,
        type: newCategory.type,
        colorToken: newCategory.colorToken || undefined,
        itemCount: 0,
      }
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories Error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
