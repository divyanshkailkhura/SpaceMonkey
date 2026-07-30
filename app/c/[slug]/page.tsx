"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePageTitle } from "@/lib/page-title";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowDown,
  ArrowUp,
  MessageSquare,
  MoreHorizontal,
  PenSquare,
  Loader2,
  Users,
  FileText,
  LogIn,
} from "lucide-react";
import { api } from "@/lib/api";

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

interface PostAuthor {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

interface TagInfo {
  tag: { id: string; name: string };
}

interface PostData {
  id: string;
  title: string;
  content: string;
  author: PostAuthor;
  createdAt: string;
  tags: TagInfo[];
  score: number;
  userVote: string | null;
  commentCount: number;
}

const CATEGORY_OPTIONS = [
  { value: "OBSERVATION", label: "Observation" },
  { value: "ASTROPHOTOGRAPHY", label: "Astrophotography" },
  { value: "QUESTION", label: "Question" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "EVENT", label: "Event" },
  { value: "OTHER", label: "Other" },
];

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
  const [createTitle, setCreateTitle] = useState("");
  const [createContent, setCreateContent] = useState("");
  const [createCategory, setCreateCategory] = useState("OTHER");
  const [createTags, setCreateTags] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

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

  const handleCreate = async () => {
    if (!createTitle.trim() || !createContent.trim()) return;
    setCreateError("");
    setCreating(true);
    try {
      const tags = createTags.split(",").map((t) => t.trim()).filter(Boolean);
      await api.post("/api/posts", {
        title: createTitle,
        content: createContent,
        category: createCategory,
        tags,
        communityId: community?.id,
      });
      setIsCreateOpen(false);
      setCreateTitle("");
      setCreateContent("");
      setCreateCategory("OTHER");
      setCreateTags("");
      fetchPosts();
      fetchCommunity();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create post");
    } finally {
      setCreating(false);
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
                  <Dialog open={isCreateOpen} onOpenChange={(v) => { setIsCreateOpen(v); if (!v) setCreateError(""); }}>
                    <DialogTrigger asChild>
                      <Button>
                        <PenSquare className="mr-2 h-4 w-4" />
                        New Post
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Create Post in c/{community.displayName}</DialogTitle>
                        <DialogDescription>Share your thoughts with the community.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="ctitle">Title</Label>
                          <Input id="ctitle" placeholder="Enter a descriptive title" value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ccontent">Content</Label>
                          <Textarea id="ccontent" placeholder="Share your thoughts..." className="min-h-[150px]" value={createContent} onChange={(e) => setCreateContent(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ccategory">Category</Label>
                          <Select value={createCategory} onValueChange={setCreateCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORY_OPTIONS.map((c) => (
                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ctags">Tags (comma-separated)</Label>
                          <Input id="ctags" placeholder="Galaxy, Astrophotography" value={createTags} onChange={(e) => setCreateTags(e.target.value)} />
                        </div>
                      </div>
                      {createError && <p className="text-sm text-red-500 text-center">{createError}</p>}
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={creating}>{creating ? "Posting..." : "Post"}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
            {posts.map((post) => (
              <Card key={post.id} className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${post.author.id}`}>
                        <Avatar>
                          <AvatarImage src={post.author.avatarUrl ?? "/placeholder.svg"} alt={post.author.name ?? ""} />
                          <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div>
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Link href={`/profile/${post.author.id}`} className="hover:text-white">
                            {post.author.name}
                          </Link>
                          <span>·</span>
                          <span>{timeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {session?.user?.id && (
                      community.userMembership?.role === "MODERATOR" || session.user.id === post.author.id
                    ) && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="whitespace-pre-wrap">{post.content}</p>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((t) => (
                        <Badge
                          key={t.tag.id}
                          variant="outline"
                          className="cursor-pointer border-purple-500 text-purple-500 hover:bg-purple-500/10"
                        >
                          {t.tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleVote(post.id, "UP")}
                        disabled={!session}
                      >
                        <ArrowUp className={`h-4 w-4 ${post.userVote === "UP" ? "text-purple-500" : ""}`} />
                      </Button>
                      <span className="text-sm min-w-[2rem] text-center font-medium">{post.score}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleVote(post.id, "DOWN")}
                        disabled={!session}
                      >
                        <ArrowDown className={`h-4 w-4 ${post.userVote === "DOWN" ? "text-purple-500" : ""}`} />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1" asChild>
                      <Link href={`/community/${post.id}`}>
                        <MessageSquare className="h-4 w-4" />
                        {post.commentCount} Comments
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
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
