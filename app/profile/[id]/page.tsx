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
import { Telescope, Star, UserPlus, UserMinus, Loader2, ArrowLeft, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { FollowersDialog } from "@/components/profile/FollowersDialog";

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

interface PostData {
  id: string;
  title: string;
  content: string;
  author: { id: string; name: string | null; avatarUrl: string | null };
  createdAt: string;
  tags: { tag: { id: string; name: string } }[];
  score: number;
  commentCount: number;
  community?: { id: string; slug: string; displayName: string } | null;
}

interface Observation {
  id: string;
  objectName: string;
  objectType: string | null;
  constellation: string | null;
  description: string | null;
  rating: number;
  observedAt: string;
}

interface CommunityMembership {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  role: string;
  joinedAt: string;
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

function formatObsDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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
  const [observations, setObservations] = useState<Observation[]>([]);
  const [obsLoading, setObsLoading] = useState(false);
  const [communities, setCommunities] = useState<CommunityMembership[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

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
      const res = await fetch(`/api/users/${userId}/posts`);
      if (res.ok) {
        const json = await res.json();
        setPosts(json.data || []);
      }
    } catch {} finally {
      setPostsLoading(false);
    }
  }, [userId]);

  const fetchObservations = useCallback(async () => {
    setObsLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/observations`);
      if (res.ok) {
        const json = await res.json();
        setObservations(json.data || []);
      }
    } catch {} finally {
      setObsLoading(false);
    }
  }, [userId]);

  const fetchCommunities = useCallback(async () => {
    setCommunitiesLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/communities`);
      if (res.ok) {
        const json = await res.json();
        setCommunities(json.data || []);
      }
    } catch {} finally {
      setCommunitiesLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!profile) return;
    if (activeTab === "posts") fetchPosts();
    if (activeTab === "observations") fetchObservations();
    if (activeTab === "communities") fetchCommunities();
  }, [activeTab, profile, fetchPosts, fetchObservations, fetchCommunities]);

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
                <button onClick={() => setFollowersOpen(true)} className="cursor-pointer text-center hover:text-purple-400">
                  <p className="text-lg font-bold">{profile.followerCount}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </button>
                <button onClick={() => setFollowingOpen(true)} className="cursor-pointer text-center hover:text-purple-400">
                  <p className="text-lg font-bold">{profile.followingCount}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </button>
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
              <TabsTrigger value="communities">Communities</TabsTrigger>
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
            <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Observations</h3>
                {obsLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : observations.length === 0 ? (
                  <p className="text-muted-foreground">
                    {isOwn ? "Log observations from the star map!" : `${profile.name ?? "User"} hasn't logged any observations yet.`}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {observations.map((obs) => (
                      <div key={obs.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                        <Telescope className="h-6 w-6 text-purple-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{obs.objectName}</p>
                          <p className="text-xs text-muted-foreground">
                            {[obs.objectType, obs.constellation].filter(Boolean).join(" · ")}
                            {" · "}{formatObsDate(obs.observedAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < obs.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "communities" && (
            <div className="space-y-2">
              {communitiesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : communities.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                  <p className="text-muted-foreground">Not a member of any communities yet.</p>
                </div>
              ) : (
                communities.map((c) => (
                  <Link key={c.id} href={`/c/${c.slug}`}>
                    <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm transition-colors hover:bg-accent">
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">c/{c.displayName}</p>
                          {c.description && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{c.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {c.role === "MODERATOR" ? "Moderator" : "Member"}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <FollowersDialog
        open={followersOpen}
        onOpenChange={setFollowersOpen}
        userId={profile.id}
        mode="followers"
      />
      <FollowersDialog
        open={followingOpen}
        onOpenChange={setFollowingOpen}
        userId={profile.id}
        mode="following"
      />
    </div>
  );
}
