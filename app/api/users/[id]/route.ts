import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const db = await getDb();

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      bio: true,
      location: true,
      createdAt: true,
      _count: { select: { posts: true, observations: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [followerCount, followingCount] = await Promise.all([
    db.follow.count({ where: { followingId: id } }),
    db.follow.count({ where: { followerId: id } }),
  ]);

  let isFollowing = false;
  if (session?.user?.id && session.user.id !== id) {
    const follow = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId: id } },
    });
    isFollowing = !!follow;
  }

  return NextResponse.json({
    data: {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      createdAt: user.createdAt,
      postCount: user._count.posts,
      observationCount: user._count.observations,
      followerCount,
      followingCount,
      isFollowing,
    },
  });
}
