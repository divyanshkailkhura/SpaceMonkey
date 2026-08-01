import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { attachScore } from "@/utils/postScore";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") ?? "recent";
  const orderBy: Prisma.PostOrderByWithRelationInput = sort === "popular"
    ? { createdAt: "desc" }
    : { createdAt: "desc" };
  const search = searchParams.get("search") ?? "";
  const communityId = searchParams.get("communityId") ?? null;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 10;

  const db = await getDb();

  const where: Prisma.PostWhereInput = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }
  if (communityId) {
    const community = await db.community.findUnique({ where: { slug: communityId } });
    if (community) {
      where.communityId = community.id;
    }
  }

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy,
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

  const data = await attachScore(db, posts, session?.user?.id);

  return NextResponse.json({
    data,
    meta: { page, totalPages: Math.ceil(total / limit), total },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, content, category, tags, communityId } = await req.json();

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const db = await getDb();

  if (communityId) {
    const community = await db.community.findUnique({ where: { id: communityId } });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }
    const membership = await db.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: session.user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Join the community to post" }, { status: 403 });
    }
  }

  const tagNames: string[] = (tags ?? [])
    .filter(Boolean)
    .slice(0, 5);

  const post = await db.post.create({
    data: {
      title: title.trim(),
      content: content.trim(),
      category: category ?? "OTHER",
      communityId: communityId || null,
      authorId: session.user.id,
      tags: {
        create: await Promise.all(
          tagNames.map(async (name) => {
            const tag = await db.tag.upsert({
              where: { name },
              create: { name },
              update: {},
            });
            return { tagId: tag.id };
          })
        ),
      },
    },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      tags: { include: { tag: true } },
      community: { select: { id: true, slug: true, displayName: true } },
      _count: { select: { comments: true } },
    },
  });

  const [data] = await attachScore(db, [post], session.user.id);
  return NextResponse.json({ data }, { status: 201 });
}