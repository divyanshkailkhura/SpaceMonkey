import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();

  const tags = await db.tag.findMany({
    orderBy: { posts: { _count: "desc" } },
    take: 10,
    include: { _count: { select: { posts: true } } },
  });

  return NextResponse.json({
    data: tags.filter((t) => t._count.posts > 0),
  });
}