import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const favorites = await db.favoriteObject.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: favorites });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { objectName, objectType } = await req.json();
  if (!objectName?.trim()) {
    return NextResponse.json({ error: "Object name is required" }, { status: 400 });
  }

  const db = await getDb();

  const existing = await db.favoriteObject.findUnique({
    where: { userId_objectName: { userId: session.user.id, objectName: objectName.trim() } },
  });
  if (existing) {
    await db.favoriteObject.delete({ where: { id: existing.id } });
    return NextResponse.json({ data: null });
  }

  const favorite = await db.favoriteObject.create({
    data: {
      userId: session.user.id,
      objectName: objectName.trim(),
      objectType: objectType?.trim() || null,
    },
  });

  return NextResponse.json({ data: favorite }, { status: 201 });
}