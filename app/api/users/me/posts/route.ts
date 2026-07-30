import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 10;

  const db = await getDb();
  const where = { authorId: session.user.id };

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

  const data = await Promise.all(
    posts.map(async (post) => {
      const [upvotes, downvotes] = await Promise.all([
        db.postVote.count({ where: { postId: post.id, type: "UP" } }),
        db.postVote.count({ where: { postId: post.id, type: "DOWN" } }),
      ]);

      const vote = await db.postVote.findUnique({
        where: { postId_userId: { postId: post.id, userId: session.user.id } },
      });

      return {
        ...post,
        score: upvotes - downvotes,
        userVote: vote?.type ?? null,
        commentCount: post._count.comments,
        _count: undefined,
      };
    })
  );

  return NextResponse.json({
    data,
    meta: { page, totalPages: Math.ceil(total / limit), total },
  });
}
