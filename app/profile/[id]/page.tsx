"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePageTitle } from "@/lib/page-title";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Telescope, Star, UserPlus, UserMinus, Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

interface UserProfile {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  createdAt: string;
  postCount: number;
  observationCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
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
  commentCount: number;
  community?: { id: string; slug: string; displayName: string } | null;
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

function formatMemberDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  usePageTitle("Profile - SpaceMonkey");
  const { data: session } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.get<UserProfile>(`/api/users/${userId}`);
      setProfile(data);
      setFollowing(data.isFollowing);
    } catch (e) {
      setError(e instanceof Error ? e.message : "User not found");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const res = await fetch(`/api/posts/following?page=1`);
      if (res.ok) {
        const json = await res.json();
        const userPosts = (json.data || []).filter(
          (p: PostData) => p.author.id === userId
        );
        setPosts(userPosts);
      }
    } catch {} finally {
      setPostsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [fetchProfile, fetchPosts]);

  const handleFollowToggle = async () => {
    if (!session) {
      router.push("/auth");
      return;
    }
    setFollowLoading(true);
    try {
      const result = await api.post<{ following: boolean }>(`/api/users/${userId}/follow`);
      setFollowing(result.following);
      setProfile((prev) =>
        prev
          ? { ...prev, followerCount: prev.followerCount + (result.following ? 1 : -1) }
          : prev
      );
    } catch {} finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto flex items-center justify-center px-4 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-lg text-muted-foreground">{error || "User not found"}</p>
        <Link href="/community">
          <Button variant="link" className="mt-4">Back to Community</Button>
        </Link>
      </div>
    );
  }

  const isOwn = session?.user?.id === profile.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/community" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mb-8 grid gap-6 md:grid-cols-[300px_1fr]">
        <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="mb-4 h-32 w-32 border-4 border-purple-500">
                <AvatarImage src={profile.avatarUrl ?? "/placeholder.svg"} alt={profile.name ?? "User"} />
                <AvatarFallback className="text-4xl">{getInitials(profile.name)}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold">{profile.name ?? "Unnamed Astronomer"}</h2>
              {profile.location && <p className="mt-1 text-sm text-muted-foreground">{profile.location}</p>}
              {profile.bio && <p className="mt-3 text-sm">{profile.bio}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                Member since {formatMemberDate(profile.createdAt)}
              </p>

              <div className="mt-4 flex gap-4 text-center">
                <div>
                  <p className="text-lg font-bold">{profile.followerCount}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{profile.followingCount}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
              </div>

              <div className="mt-4 flex gap-4 text-center text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" /> {profile.postCount} posts
                </span>
                <span className="flex items-center gap-1">
                  <Telescope className="h-4 w-4" /> {profile.observationCount} observations
                </span>
              </div>

              {!isOwn && (
                <Button
                  className="mt-4 w-full"
                  variant={following ? "outline" : "default"}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {following ? (
                    <>
                      <UserMinus className="mr-2 h-4 w-4" /> Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" /> Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="observations">Observations</TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === "posts" && (
            <div className="space-y-4">
              {postsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : posts.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                  <p className="text-muted-foreground">No posts yet.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          <Link href={`/community/${post.id}`} className="hover:text-purple-400">
                            {post.title}
                          </Link>
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{timeAgo(post.createdAt)}</span>
                        {post.community && (
                          <>
                            <span>·</span>
                            <Link href={`/c/${post.community.slug}`}>
                              <Badge variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                                c/{post.community.displayName}
                              </Badge>
                            </Link>
                          </>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3 text-sm">{post.content}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === "observations" && (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <Star className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">
                {isOwn ? "Log observations from the star map!" : `${profile.name ?? "User"} hasn't logged any observations yet.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FileText({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}
