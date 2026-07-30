import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  const { slug } = await params;
  const db = await getDb();

  const community = await db.community.findUnique({
    where: { slug },
    include: {
      _count: { select: { members: true, posts: true } },
    },
  });

  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  let userMembership = null;
  if (session?.user?.id) {
    const membership = await db.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: session.user.id } },
    });
    if (membership) {
      userMembership = { role: membership.role, joinedAt: membership.joinedAt };
    }
  }

  return NextResponse.json({
    data: {
      id: community.id,
      slug: community.slug,
      displayName: community.displayName,
      description: community.description,
      bannerUrl: community.bannerUrl,
      creatorId: community.creatorId,
      createdAt: community.createdAt,
      memberCount: community._count.members,
      postCount: community._count.posts,
      userMembership,
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const db = await getDb();

  const community = await db.community.findUnique({ where: { slug } });
  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const membership = await db.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId: session.user.id } },
  });

  if (!membership || membership.role !== "MODERATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { displayName, description } = await req.json();

  const data: Record<string, unknown> = {};
  if (displayName !== undefined) data.displayName = displayName;
  if (description !== undefined) data.description = description;

  const updated = await db.community.update({
    where: { id: community.id },
    data,
    include: {
      _count: { select: { members: true, posts: true } },
    },
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      slug: updated.slug,
      displayName: updated.displayName,
      description: updated.description,
      bannerUrl: updated.bannerUrl,
      createdAt: updated.createdAt,
      memberCount: updated._count.members,
      postCount: updated._count.posts,
    },
  });
}
