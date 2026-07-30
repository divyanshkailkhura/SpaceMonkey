import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;

  const db = await getDb();

  const user = await db.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const where = { userId: id };

  const [observations, total] = await Promise.all([
    db.observation.findMany({
      where,
      orderBy: { observedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.observation.count({ where }),
  ]);

  return NextResponse.json({
    data: observations,
    meta: { page, totalPages: Math.ceil(total / limit), total },
  });
}
