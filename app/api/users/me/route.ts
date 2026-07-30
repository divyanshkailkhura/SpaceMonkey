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
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
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
    db.follow.count({ where: { followingId: user.id } }),
    db.follow.count({ where: { followerId: user.id } }),
  ]);

  return NextResponse.json({
    data: {
      ...user,
      followerCount,
      followingCount,
      postCount: user._count.posts,
      observationCount: user._count.observations,
      _count: undefined,
    },
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, bio, location } = body;

  const db = await getDb();
  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(bio !== undefined && { bio }),
      ...(location !== undefined && { location }),
    },
    select: { id: true, email: true, name: true, avatarUrl: true, bio: true, location: true, createdAt: true },
  });

  return NextResponse.json({ data: user });
}