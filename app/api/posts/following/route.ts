import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { attachScore } from "@/utils/postScore";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 10;

  const db = await getDb();

  const following = await db.follow.findMany({
    where: { followerId: session.user.id },
    select: { followingId: true },
  });

  const followingIds = following.map((f) => f.followingId);

  if (followingIds.length === 0) {
    return NextResponse.json({ data: [], meta: { page, totalPages: 0, total: 0 } });
  }

  const where = { authorId: { in: followingIds } };

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        tags: { include: { tag: true } },
        community: { select: { id: true, slug: true, displayName: true } },
        _count: { select: { comments: true } },
      },
    }),
    db.post.count({ where }),
  ]);

  const data = await attachScore(db, posts, session.user.id);

  return NextResponse.json({
    data,
    meta: { page, totalPages: Math.ceil(total / limit), total },
  });
}
