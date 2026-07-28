import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();

  const users = await db.user.findMany({
    orderBy: { posts: { _count: "desc" } },
    take: 5,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      _count: { select: { posts: true } },
    },
  });

  return NextResponse.json({
    data: users.filter((u) => u._count.posts > 0),
  });
}