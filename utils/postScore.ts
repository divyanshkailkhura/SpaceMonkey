import type { getDb } from "@/lib/db";

export interface ScorePost {
  id: string;
  _count?: { comments: number };
  [key: string]: unknown;
}

export interface ScoredPost extends Omit<ScorePost, "_count"> {
  score: number;
  userVote: string | null;
  commentCount: number;
}

type Db = Awaited<ReturnType<typeof getDb>>;

export async function attachScore(
  db: Db,
  posts: ScorePost[],
  userId: string | undefined
): Promise<ScoredPost[]> {
  if (posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);

  const [voteGroups, userVotes] = await Promise.all([
    db.postVote.groupBy({
      by: ["postId", "type"],
      where: { postId: { in: postIds } },
      _count: { _all: true },
    }),
    userId
      ? db.postVote.findMany({
          where: { postId: { in: postIds }, userId },
          select: { postId: true, type: true },
        })
      : Promise.resolve([] as { postId: string; type: string }[]),
  ]);

  const upvotes = new Map<string, number>();
  const downvotes = new Map<string, number>();
  for (const g of voteGroups) {
    const count = g._count._all;
    if (g.type === "UP") upvotes.set(g.postId, count);
    else if (g.type === "DOWN") downvotes.set(g.postId, count);
  }

  const userVoteMap = new Map<string, string>();
  for (const v of userVotes) {
    userVoteMap.set(v.postId, v.type);
  }

  return posts.map((post) => {
    const { _count, ...rest } = post;
    return {
      ...rest,
      score: (upvotes.get(post.id) ?? 0) - (downvotes.get(post.id) ?? 0),
      userVote: userVoteMap.get(post.id) ?? null,
      commentCount: _count?.comments ?? 0,
    };
  });
}
