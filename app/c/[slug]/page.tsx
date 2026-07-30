"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePageTitle } from "@/lib/page-title";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { PenSquare, Loader2, Users, FileText, LogIn } from "lucide-react";
import { api } from "@/lib/api";
import { PostCard } from "@/components/community/PostCard";
import { CreatePostDialog } from "@/components/community/CreatePostDialog";
import type { PostData } from "@/lib/shared-types";

interface CommunityData {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  bannerUrl: string | null;
  creatorId: string;
  createdAt: string;
  memberCount: number;
  postCount: number;
  userMembership: { role: string; joinedAt: string } | null;
}

export default function CommunityPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  usePageTitle(`c/${slug} - SpaceMonkey`);
  const { data: session } = useSession();
  const router = useRouter();

  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [loadingComm, setLoadingComm] = useState(true);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchCommunity = useCallback(async () => {
    try {
      const data = await api.get<CommunityData>(`/api/communities/${slug}`);
      setCommunity(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Community not found");
    } finally {
      setLoadingComm(false);
    }
  }, [slug]);

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/posts?communityId=${encodeURIComponent(slug)}`);
      const json = await res.json();
      setPosts(json.data);
    } catch {
    } finally {
      setLoadingPosts(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCommunity();
    fetchPosts();
  }, [fetchCommunity, fetchPosts]);

  const handleJoinToggle = async () => {
    if (!session) {
      router.push("/auth");
      return;
    }
    setJoining(true);
    try {
      const result = await api.post<{ joined: boolean }>(`/api/communities/${slug}/join`);
      setCommunity((prev) =>
        prev
          ? {
              ...prev,
              memberCount: prev.memberCount + (result.joined ? 1 : -1),
              userMembership: result.joined ? { role: "MEMBER", joinedAt: new Date().toISOString() } : null,
            }
          : prev
      );
    } catch {
    } finally {
      setJoining(false);
    }
  };

  const handleVote = async (postId: string, type: "UP" | "DOWN") => {
    if (!session) return;
    const prev = posts.find((p) => p.id === postId);
    if (!prev) return;

    const oldVote = prev.userVote;
    let newVote: string | null;
    let delta: number;

    if (oldVote === type) {
      newVote = null;
      delta = type === "UP" ? -1 : 1;
    } else if (oldVote === null) {
      newVote = type;
      delta = type === "UP" ? 1 : -1;
    } else {
      newVote = type;
      delta = type === "UP" ? 2 : -2;
    }

    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id === postId ? { ...p, score: p.score + delta, userVote: newVote } : p
      )
    );

    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok && res.status !== 409) {
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId ? { ...p, score: p.score - delta, userVote: oldVote } : p
          )
        );
      }
      if (res.status === 409) {
        fetchPosts();
      }
    } catch {
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, score: p.score - delta, userVote: oldVote } : p
        )
      );
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await api.delete(`/api/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      fetchCommunity();
    } catch {}
  };

  if (loadingComm) {
    return (
      <div className="container mx-auto flex items-center justify-center px-4 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-lg text-muted-foreground">{error || "Community not found"}</p>
        <Link href="/community">
          <Button variant="link" className="mt-4">Back to Community</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/community" className="mb-4 inline-block text-sm text-muted-foreground hover:text-white">
        ← Back to Community
      </Link>

      <div className="mb-8 rounded-2xl border border-purple-800/20 bg-card/50 p-8 backdrop-blur-sm">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">c/{community.displayName}</h1>
            <p className="mt-2 text-muted-foreground">{community.description || `A community about ${community.displayName}`}</p>
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {community.memberCount} members
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {community.postCount} posts
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {session ? (
              <>
                <Button
                  variant={community.userMembership ? "outline" : "default"}
                  onClick={handleJoinToggle}
                  disabled={joining}
                >
                  {community.userMembership ? "Leave" : "Join"}
                </Button>
                {community.userMembership && (
                  <>
                    <Button onClick={() => setIsCreateOpen(true)}>
                      <PenSquare className="mr-2 h-4 w-4" />
                      New Post
                    </Button>
                    <CreatePostDialog
                      open={isCreateOpen}
                      onOpenChange={setIsCreateOpen}
                      onPostCreated={() => { fetchPosts(); fetchCommunity(); }}
                      communityId={community.id}
                      communityName={community.displayName}
                    />
                  </>
                )}
              </>
            ) : (
              <Link href="/auth">
                <Button variant="outline" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign in to Join
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {community.userMembership ? (
        loadingPosts ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
            <p className="text-muted-foreground">No posts in this community yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const canDelete = session?.user?.id && (
                community.userMembership?.role === "MODERATOR" || session.user.id === post.author.id
              )
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  onVote={handleVote}
                  onDelete={canDelete ? handleDelete : undefined}
                  disabled={!session}
                />
              )
            })}
          </div>
        )
      ) : (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
          <p className="text-muted-foreground">Join this community to view posts</p>
        </div>
      )}
    </div>
  );
}
