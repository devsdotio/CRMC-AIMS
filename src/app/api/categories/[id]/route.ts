import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/server/db";
import { categories } from "@/server/db/schema";
import { requireActor } from "@/server/shared/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const db = getDb();
    const body = await request.json();
    
    if (!body.name || !body.type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const [updatedCategory] = await db
      .update(categories)
      .set({
        name: body.name,
        type: body.type,
        updatedAt: new Date(),
      })
      .where(and(
        eq(categories.id, id),
        eq(categories.createdByUserId, actor.userId)
      ))
      .returning();
      
    if (!updatedCategory) {
      return NextResponse.json({ error: "Category not found or unauthorized" }, { status: 404 });
    }
      
    return NextResponse.json({
      data: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        type: updatedCategory.type,
        colorToken: updatedCategory.colorToken || undefined,
        itemCount: 0,
      }
    });
  } catch (error) {
    console.error("PUT /api/categories/[id] Error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actor = await requireActor();
    const db = getDb();
    
    const [deletedCategory] = await db
      .delete(categories)
      .where(and(
        eq(categories.id, id),
        eq(categories.createdByUserId, actor.userId)
      ))
      .returning();
      
    if (!deletedCategory) {
      return NextResponse.json({ error: "Category not found or unauthorized" }, { status: 404 });
    }
      
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("DELETE /api/categories/[id] Error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
