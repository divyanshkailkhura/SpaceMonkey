import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  const { type } = await req.json();

  if (type !== "UP" && type !== "DOWN") {
    return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
  }

  const db = await getDb();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await db.$transaction(async (tx) => {
        const existing = await tx.postVote.findUnique({
          where: { postId_userId: { postId, userId: session.user.id } },
        });

        if (existing) {
          if (existing.type === type) {
            await tx.postVote.delete({ where: { id: existing.id } });
          } else {
            await tx.postVote.update({
              where: { id: existing.id },
              data: { type },
            });
          }
        } else {
          await tx.postVote.create({
            data: { postId, userId: session.user.id, type },
          });
        }
      });
      break;
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code !== "P2025" && e.code !== "P2002") throw err;
      if (attempt === 2) {
        return NextResponse.json({ error: "Conflict, retry" }, { status: 409 });
      }
    }
  }

  const [upvotes, downvotes] = await Promise.all([
    db.postVote.count({ where: { postId, type: "UP" } }),
    db.postVote.count({ where: { postId, type: "DOWN" } }),
  ]);

  const vote = await db.postVote.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  });

  const post = await db.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      tags: { include: { tag: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json({
    data: {
      ...post,
      score: upvotes - downvotes,
      userVote: vote?.type ?? null,
      commentCount: post?._count.comments ?? 0,
      _count: undefined,
    },
  });
}