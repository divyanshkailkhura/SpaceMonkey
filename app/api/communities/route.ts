import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = await getDb();
  const session = await getServerSession(authOptions);
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search")?.trim();

  const where = search
    ? { displayName: { contains: search, mode: "insensitive" as const } }
    : {};

  const communities = await db.community.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: true, posts: true } },
    },
  });

  const communityIds = communities.map((c) => c.id);

  let memberships: Map<string, boolean> = new Map();
  if (session?.user?.id && communityIds.length > 0) {
    const rows = await db.communityMember.findMany({
      where: {
        userId: session.user.id,
        communityId: { in: communityIds },
      },
      select: { communityId: true },
    });
    memberships = new Map(rows.map((r) => [r.communityId, true]));
  }

  return NextResponse.json({
    data: communities.map((c) => ({
      id: c.id,
      slug: c.slug,
      displayName: c.displayName,
      description: c.description,
      bannerUrl: c.bannerUrl,
      createdAt: c.createdAt,
      memberCount: c._count.members,
      postCount: c._count.posts,
      joined: memberships.has(c.id),
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { displayName, description } = await req.json();

  if (!displayName?.trim()) {
    return NextResponse.json({ error: "Community name is required" }, { status: 400 });
  }

  const slug = displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    return NextResponse.json({ error: "Invalid community name" }, { status: 400 });
  }

  const db = await getDb();

  const existing = await db.community.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A community with this name already exists" }, { status: 409 });
  }

  const community = await db.community.create({
    data: {
      slug,
      displayName: displayName.trim(),
      description: description?.trim() || null,
      creatorId: session.user.id,
      members: {
        create: { userId: session.user.id, role: "MODERATOR" },
      },
    },
    include: {
      _count: { select: { members: true, posts: true } },
    },
  });

  return NextResponse.json(
    {
      data: {
        id: community.id,
        slug: community.slug,
        displayName: community.displayName,
        description: community.description,
        bannerUrl: community.bannerUrl,
        createdAt: community.createdAt,
        memberCount: community._count.members,
        postCount: community._count.posts,
      },
    },
    { status: 201 }
  );
}
