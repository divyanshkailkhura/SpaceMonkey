import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

async function attachScore(db: Awaited<ReturnType<typeof getDb>>, posts: Record<string, unknown>[], userId: string | undefined) {
  return Promise.all(
    posts.map(async (post) => {
      const [upvotes, downvotes] = await Promise.all([
        db.postVote.count({ where: { postId: post.id, type: "UP" } }),
        db.postVote.count({ where: { postId: post.id, type: "DOWN" } }),
      ]);

      let userVote: string | null = null;
      if (userId) {
        const vote = await db.postVote.findUnique({
          where: { postId_userId: { postId: post.id, userId } },
        });
        userVote = vote?.type ?? null;
      }

      return {
        ...post,
        score: upvotes - downvotes,
        userVote,
        commentCount: post._count.comments,
        _count: undefined,
      };
    })
  );
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") ?? "recent";
  const orderBy = sort === "popular" ? { createdAt: "desc" as const } : { createdAt: "desc" as const };
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 10;

  const db = await getDb();

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { content: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        tags: { include: { tag: true } },
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

  const { title, content, category, tags } = await req.json();

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const db = await getDb();

  const tagNames: string[] = (tags ?? [])
    .filter(Boolean)
    .slice(0, 5);

  const post = await db.post.create({
    data: {
      title: title.trim(),
      content: content.trim(),
      category: category ?? "OTHER",
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
      _count: { select: { comments: true } },
    },
  });

  const [data] = await attachScore(db, [post], session.user.id);
  return NextResponse.json({ data }, { status: 201 });
}