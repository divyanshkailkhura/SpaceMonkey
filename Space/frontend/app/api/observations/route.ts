import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));

  const db = await getDb();

  const [observations, total] = await Promise.all([
    db.observation.findMany({
      where: { userId: session.user.id },
      orderBy: { observedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.observation.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({
    data: observations,
    meta: { page, totalPages: Math.ceil(total / limit), total },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { objectName, objectType, constellation, description, rating, observedAt } = body;

  if (!objectName?.trim()) {
    return NextResponse.json({ error: "Object name is required" }, { status: 400 });
  }

  const db = await getDb();

  const observation = await db.observation.create({
    data: {
      userId: session.user.id,
      objectName: objectName.trim(),
      objectType: objectType?.trim() || null,
      constellation: constellation?.trim() || null,
      description: description?.trim() || null,
      rating: Math.min(5, Math.max(0, parseInt(String(rating)) || 0)),
      observedAt: observedAt ? new Date(observedAt) : new Date(),
    },
  });

  return NextResponse.json({ data: observation }, { status: 201 });
}