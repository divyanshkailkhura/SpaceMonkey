import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

  if (!q) {
    return NextResponse.json({ data: [] });
  }

  const db = await getDb();

  const users = await db.user.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    take: limit,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      bio: true,
      _count: { select: { posts: true, followers: true, following: true } },
    },
  });

  const userIds = users.map((u) => u.id);

  let followingMap: Map<string, boolean> = new Map();
  if (session?.user?.id && userIds.length > 0) {
    const rows = await db.follow.findMany({
      where: {
        followerId: session.user.id,
        followingId: { in: userIds },
      },
      select: { followingId: true },
    });
    followingMap = new Map(rows.map((r) => [r.followingId, true]));
  }

  return NextResponse.json({
    data: users.map((u) => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      postCount: u._count.posts,
      followerCount: u._count.followers,
      followingCount: u._count.following,
      isFollowing: followingMap.has(u.id),
    })),
  });
}
