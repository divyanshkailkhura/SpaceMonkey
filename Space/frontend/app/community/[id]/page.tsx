"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowUp, ArrowDown, MessageSquare, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Author {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

interface CommentData {
  id: string;
  content: string;
  author: Author;
  createdAt: string;
}

interface PostDetail {
  id: string;
  title: string;
  content: string;
  category: string;
  author: Author;
  createdAt: string;
  tags: { tag: { id: string; name: string } }[];
  score: number;
  userVote: "UP" | "DOWN" | null;
  commentCount: number;
  comments: CommentData[];
}

function getInitials(name: string | null) {
  if (!name) return "??";
  return name.substring(0, 2).toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setPost(d.data);
      })
      .catch(() => setError("Failed to load post"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleVote = async (type: "UP" | "DOWN") => {
    if (!session || !post) return;
    const oldVote = post.userVote;
    let newVote: "UP" | "DOWN" | null;
    let delta: number;

    if (oldVote === type) {
      newVote = null;
      delta = type === "UP" ? -1 : 1;
    } else if (!oldVote) {
      newVote = type;
      delta = type === "UP" ? 1 : -1;
    } else {
      newVote = type;
      delta = type === "UP" ? 2 : -2;
    }

    setPost({ ...post, score: post.score + delta, userVote: newVote });

    try {
      const res = await fetch(`/api/posts/${post.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok && res.status !== 409) {
        setPost({ ...post, score: post.score - delta, userVote: oldVote });
      }
      if (res.status === 409) {
        const refresh = await fetch(`/api/posts/${post.id}`).then((r) => r.json());
        setPost(refresh.data);
      }
    } catch {
      setPost({ ...post, score: post.score - delta, userVote: oldVote });
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !post) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });
      const json = await res.json();
      if (res.ok) {
        setPost({ ...post, comments: [...post.comments, json.data], commentCount: post.commentCount + 1 });
        setCommentText("");
      }
    } catch {
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto flex items-center justify-center px-4 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-muted-foreground">{error ?? "Post not found"}</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/community">Back to Community</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/community">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Community
        </Link>
      </Button>

      <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.author.avatarUrl ?? "/placeholder.svg"} alt={post.author.name ?? ""} />
              <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{post.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{post.author.name}</span>
                <span>·</span>
                <span>{timeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap">{post.content}</p>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <Badge key={t.tag.id} variant="outline" className="border-purple-500 text-purple-500">
                  {t.tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleVote("UP")} disabled={!session}>
                <ArrowUp className={`h-4 w-4 ${post.userVote === "UP" ? "text-purple-500" : ""}`} />
              </Button>
              <span className="text-sm font-medium min-w-[2rem] text-center">{post.score}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleVote("DOWN")} disabled={!session}>
                <ArrowDown className={`h-4 w-4 ${post.userVote === "DOWN" ? "text-purple-500" : ""}`} />
              </Button>
            </div>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{post.commentCount} Comments</span>
          </div>
        </CardFooter>
      </Card>

      <h3 className="text-lg font-semibold mb-4">Comments ({post.commentCount})</h3>

      <div className="space-y-4 mb-8">
        {post.comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          post.comments.map((comment) => (
            <Card key={comment.id} className="border-purple-800/20 bg-card/30 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author.avatarUrl ?? "/placeholder.svg"} alt={comment.author.name ?? ""} />
                    <AvatarFallback>{getInitials(comment.author.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{comment.author.name}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {session ? (
        <div className="flex gap-3">
          <Input
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
            className="flex-1"
          />
          <Button onClick={handleComment} disabled={posting || !commentText.trim()}>
            {posting ? "Posting..." : "Post"}
          </Button>
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          <Link href="/auth" className="text-purple-400 hover:underline">Sign in</Link> to add a comment.
        </p>
      )}
    </div>
  );
}