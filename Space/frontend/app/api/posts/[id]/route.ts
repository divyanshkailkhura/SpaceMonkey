import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const db = await getDb();

  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      tags: { include: { tag: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
      _count: { select: { comments: true } },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const [upvotes, downvotes] = await Promise.all([
    db.postVote.count({ where: { postId: id, type: "UP" } }),
    db.postVote.count({ where: { postId: id, type: "DOWN" } }),
  ]);

  let userVote: string | null = null;
  if (session?.user?.id) {
    const vote = await db.postVote.findUnique({
      where: { postId_userId: { postId: id, userId: session.user.id } },
    });
    userVote = vote?.type ?? null;
  }

  return NextResponse.json({
    data: {
      ...post,
      score: upvotes - downvotes,
      userVote,
      commentCount: post._count.comments,
      _count: undefined,
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = await getDb();

  const post = await db.post.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (post.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.post.delete({ where: { id } });
  return NextResponse.json({ data: null });
}