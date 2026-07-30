"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePageTitle } from "@/lib/page-title"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Loader2, PenSquare } from "lucide-react"
import { api } from "@/lib/api"
import { PostCard } from "@/components/community/PostCard"
import { CreatePostDialog } from "@/components/community/CreatePostDialog"
import { FeedSidebar } from "@/components/community/FeedSidebar"
import { CreateCommunityDialog } from "@/components/community/CreateCommunityDialog"
import type { PostData } from "@/lib/shared-types"

export function HomeFeed() {
  usePageTitle("Home - SpaceMonkey")
  const { data: session } = useSession()

  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createCommOpen, setCreateCommOpen] = useState(false)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/posts/following")
      const json = await res.json()
      setPosts(json.data)
    } catch {
      setError("Failed to load posts")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleVote = async (postId: string, type: "UP" | "DOWN") => {
    if (!session) return
    const prev = posts.find((p) => p.id === postId)
    if (!prev) return

    const oldVote = prev.userVote
    let newVote: string | null
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
        fetchPosts()
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
    } catch {}
  }

  const handleTagClick = (tagName: string) => {
    window.location.href = `/community?search=${encodeURIComponent(tagName)}`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Home</h1>
          <p className="text-muted-foreground">Your personal astronomy feed</p>
        </div>
        <Button disabled={!session} onClick={() => setIsCreateOpen(true)}>
          <PenSquare className="mr-2 h-4 w-4" />
          New Post
        </Button>
        <CreatePostDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onPostCreated={fetchPosts}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <p className="text-muted-foreground">{error}</p>
              <Button variant="link" onClick={fetchPosts}>Retry</Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <p className="text-muted-foreground">
                Follow stargazers to see their posts here!
              </p>
              <Link href="/community">
                <Button variant="link">Discover the community</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onVote={handleVote}
                  onDelete={session?.user?.id === post.author.id ? handleDelete : undefined}
                  onTagClick={handleTagClick}
                  disabled={!session}
                />
              ))}
            </div>
          )}
        </div>

        <FeedSidebar
          onTagClick={handleTagClick}
          onCreateCommunity={() => setCreateCommOpen(true)}
        />
      </div>

      <CreateCommunityDialog
        open={createCommOpen}
        onOpenChange={setCreateCommOpen}
        onCreated={() => {}}
      />
    </div>
  )
}
