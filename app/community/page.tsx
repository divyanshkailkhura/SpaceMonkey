"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePageTitle } from "@/lib/page-title"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowDown, ArrowUp, MessageSquare, MoreHorizontal, PenSquare, Search, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

interface PostAuthor {
  id: string
  name: string | null
  avatarUrl: string | null
}

interface TagInfo {
  tag: { id: string; name: string }
}

interface PostData {
  id: string
  title: string
  content: string
  category: string
  author: PostAuthor
  createdAt: string
  tags: TagInfo[]
  score: number
  userVote: "UP" | "DOWN" | null
  commentCount: number
}

interface StatsData {
  members: number
  posts: number
}

interface TagData {
  name: string
  _count: { posts: number }
}

interface TopUser {
  id: string
  name: string | null
  avatarUrl: string | null
  _count: { posts: number }
}

function getInitials(name: string | null) {
  if (!name) return "??"
  return name.substring(0, 2).toUpperCase()
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

const CATEGORY_OPTIONS = [
  { value: "OBSERVATION", label: "Observation" },
  { value: "ASTROPHOTOGRAPHY", label: "Astrophotography" },
  { value: "QUESTION", label: "Question" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "EVENT", label: "Event" },
  { value: "OTHER", label: "Other" },
]

export default function CommunityPage() {
  usePageTitle("Community - SpaceMonkey")
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("popular")
  const [searchQuery, setSearchQuery] = useState("")
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [stats, setStats] = useState<StatsData>({ members: 0, posts: 0 })
  const [popTags, setPopTags] = useState<TagData[]>([])
  const [topUsers, setTopUsers] = useState<TopUser[]>([])

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState("")
  const [createContent, setCreateContent] = useState("")
  const [createCategory, setCreateCategory] = useState("OTHER")
  const [createTags, setCreateTags] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  const fetchPosts = useCallback(async (sort: string, search: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ sort })
      if (search) params.set("search", search)
      const res = await fetch(`/api/posts?${params}`)
      const json = await res.json()
      setPosts(json.data)
    } catch {
      setError("Failed to load posts")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts(activeTab === "popular" ? "recent" : "recent", searchQuery)
  }, [activeTab, searchQuery, fetchPosts])

  useEffect(() => {
    api.get<StatsData>("/api/stats").then(setStats).catch(() => {})
    api.get<TagData[]>("/api/tags").then(setPopTags).catch(() => {})
    api.get<TopUser[]>("/api/users/top").then(setTopUsers).catch(() => {})
  }, [])

  const handleCreate = async () => {
    if (!createTitle.trim() || !createContent.trim()) return
      setCreateError("")
      setCreating(true)
      try {
        const tags = createTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
        await api.post("/api/posts", {
          title: createTitle,
          content: createContent,
          category: createCategory,
          tags,
        })
        setIsCreateOpen(false)
        setCreateTitle("")
        setCreateContent("")
        setCreateCategory("OTHER")
        setCreateTags("")
        fetchPosts(activeTab, searchQuery)
        api.get<StatsData>("/api/stats").then(setStats).catch(() => {})
      } catch (e) {
        setCreateError(e instanceof Error ? e.message : "Failed to create post")
      } finally {
      setCreating(false)
    }
  }

  const handleVote = async (postId: string, type: "UP" | "DOWN") => {
    if (!session) return
    const prev = posts.find((p) => p.id === postId)
    if (!prev) return

    const oldVote = prev.userVote
    let newVote: "UP" | "DOWN" | null
    let delta: number

    if (oldVote === type) {
      newVote = null
      delta = type === "UP" ? -1 : 1
    } else if (oldVote === null) {
      newVote = type
      delta = type === "UP" ? 1 : -1
    } else {
      newVote = type
      delta = type === "UP" ? 2 : -2
    }

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, score: p.score + delta, userVote: newVote } : p))
    )

    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
      if (!res.ok && res.status !== 409) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, score: p.score - delta, userVote: oldVote } : p))
        )
      }
      if (res.status === 409) {
        fetchPosts(activeTab, searchQuery)
      }
    } catch {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, score: p.score - delta, userVote: oldVote } : p))
      )
    }
  }

  const handleDelete = async (postId: string) => {
    try {
      await api.delete(`/api/posts/${postId}`)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      api.get<StatsData>("/api/stats").then(setStats).catch(() => {})
    } catch {
    }
  }

  const handleTagClick = (tagName: string) => {
    setSearchQuery(tagName)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Community</h1>
          <p className="text-muted-foreground">Connect with fellow astronomy enthusiasts</p>
        </div>
        <div className="flex w-full items-center gap-2 md:w-auto">
          <div className="relative flex-1 md:w-64 md:flex-none">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(v) => { setIsCreateOpen(v); if (!v) setCreateError(""); }}>
            <DialogTrigger asChild>
              <Button disabled={!session}>
                <PenSquare className="mr-2 h-4 w-4" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>
                  Share your astronomy experiences, questions, or discoveries.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="Enter a descriptive title" value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" placeholder="Share your thoughts..." className="min-h-[150px]" value={createContent} onChange={(e) => setCreateContent(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
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
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input id="tags" placeholder="Galaxy, Astrophotography" value={createTags} onChange={(e) => setCreateTags(e.target.value)} />
                </div>
              </div>
              {createError && (
                <p className="text-sm text-red-500 text-center">{createError}</p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={creating}>{creating ? "Posting..." : "Post"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <p className="text-muted-foreground">{error}</p>
              <Button variant="link" onClick={() => fetchPosts(activeTab, searchQuery)}>Retry</Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <p className="text-muted-foreground">
                {searchQuery ? "No posts found matching your search" : "No posts yet. Be the first to post!"}
              </p>
              {searchQuery && <Button variant="link" onClick={() => setSearchQuery("")}>Clear search</Button>}
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={post.author.avatarUrl ?? "/placeholder.svg"} alt={post.author.name ?? ""} />
                          <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{post.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{post.author.name}</span>
                            <span>·</span>
                            <span>{timeAgo(post.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      {session?.user?.id === post.author.id && (
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
                            onClick={() => handleTagClick(t.tag.name)}
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
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Community Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{stats.members}</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.posts}</p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {popTags.length > 0 && (
            <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Popular Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {popTags.map((tag) => (
                    <Badge
                      key={tag.name}
                      variant="outline"
                      className="cursor-pointer border-purple-500 text-purple-500 hover:bg-purple-500/10"
                      onClick={() => handleTagClick(tag.name)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {topUsers.length > 0 && (
            <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Top Contributors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl ?? "/placeholder.svg"} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user._count.posts} posts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
  )
}