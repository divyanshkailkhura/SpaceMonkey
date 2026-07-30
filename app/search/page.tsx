"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { usePageTitle } from "@/lib/page-title"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, Users, BookOpen } from "lucide-react"
import { FollowButton } from "@/components/community/FollowButton"
import { getInitials } from "@/lib/post-utils"

interface CommunityResult {
  id: string
  slug: string
  displayName: string
  description: string | null
  memberCount: number
  postCount: number
  joined: boolean
}

interface UserResult {
  id: string
  name: string | null
  avatarUrl: string | null
  bio: string | null
  postCount: number
  followerCount: number
  followingCount: number
  isFollowing: boolean
}

interface TopUser {
  id: string
  name: string | null
  avatarUrl: string | null
  _count: { posts: number }
}

export default function DiscoverPage() {
  usePageTitle("Discover - SpaceMonkey")
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState("communities")
  const [communities, setCommunities] = useState<CommunityResult[]>([])
  const [users, setUsers] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [stats, setStats] = useState({ members: 0, posts: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setCommunities([])
      setUsers([])
      return
    }
    setLoading(true)
    try {
      const [commRes, userRes] = await Promise.all([
        fetch(`/api/communities?search=${encodeURIComponent(q.trim())}`),
        fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}&limit=50`),
      ])
      const [commJson, userJson] = await Promise.all([
        commRes.ok ? commRes.json() : { data: [] },
        userRes.ok ? userRes.json() : { data: [] },
      ])
      setCommunities(commJson.data ?? [])
      setUsers(userJson.data ?? [])
    } catch {
      setCommunities([])
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDiscovery = useCallback(async () => {
    const [commRes, userRes, statsRes] = await Promise.all([
      fetch("/api/communities"),
      fetch("/api/users/top"),
      fetch("/api/stats"),
    ])
    const [commJson, userJson, statsJson] = await Promise.all([
      commRes.ok ? commRes.json() : { data: [] },
      userRes.ok ? userRes.json() : { data: [] },
      statsRes.ok ? statsRes.json() : { data: { members: 0, posts: 0 } },
    ])
    setCommunities(commJson.data ?? [])
    setTopUsers(userJson.data ?? [])
    setStats(statsJson.data ?? { members: 0, posts: 0 })
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, doSearch])

  useEffect(() => {
    fetchDiscovery()
  }, [fetchDiscovery])

  const isSearching = query.trim().length > 0

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Discover</h1>
        <p className="mt-2 text-muted-foreground">Find communities and fellow stargazers</p>
      </div>

      <div className="relative mb-8 max-w-xl mx-auto">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search communities and users..."
          className="h-12 pl-10 text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isSearching ? (
        <>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="communities">
                Communities {communities.length > 0 && `(${communities.length})`}
              </TabsTrigger>
              <TabsTrigger value="users">
                Users {users.length > 0 && `(${users.length})`}
              </TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : tab === "communities" ? (
              communities.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                  <p className="text-muted-foreground">No communities found for &quot;{query}&quot;</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {communities.map((c) => (
                    <Link key={c.id} href={`/c/${c.slug}`}>
                      <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm transition hover:border-purple-600/50">
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                            <Users className="h-5 w-5 text-purple-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">c/{c.displayName}</span>
                              {c.joined && (
                                <Badge variant="secondary" className="text-xs">Joined</Badge>
                              )}
                            </div>
                            {c.description && (
                              <p className="text-sm text-muted-foreground truncate">{c.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {c.memberCount} members &middot; {c.postCount} posts
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              users.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                  <p className="text-muted-foreground">No users found for &quot;{query}&quot;</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((u) => (
                    <Card key={u.id} className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
                      <CardContent className="flex items-center gap-4 p-4">
                        <Link href={`/profile/${u.id}`} className="shrink-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={u.avatarUrl ?? "/placeholder.svg"} />
                            <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link href={`/profile/${u.id}`} className="font-medium hover:text-white">
                            {u.name}
                          </Link>
                          {u.bio && (
                            <p className="text-sm text-muted-foreground truncate">{u.bio}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {u.postCount} posts &middot; {u.followerCount} followers
                          </p>
                        </div>
                        <FollowButton userId={u.id} initialFollowing={u.isFollowing} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            )}
          </Tabs>
        </>
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm text-center">
              <CardContent className="p-6">
                <Users className="mx-auto mb-2 h-6 w-6 text-purple-400" />
                <p className="text-2xl font-bold">{stats.members}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </CardContent>
            </Card>
            <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm text-center">
              <CardContent className="p-6">
                <BookOpen className="mx-auto mb-2 h-6 w-6 text-blue-400" />
                <p className="text-2xl font-bold">{stats.posts}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </CardContent>
            </Card>
          </div>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Popular Communities</h2>
              <Link href="/community" className="text-sm text-purple-400 hover:text-purple-300">
                View all posts
              </Link>
            </div>
            {communities.length === 0 ? (
              <div className="h-20 animate-pulse rounded-lg bg-slate-800" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {communities.slice(0, 6).map((c) => (
                  <Link key={c.id} href={`/c/${c.slug}`}>
                    <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm transition hover:border-purple-600/50 h-full">
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                          <Users className="h-4 w-4 text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">c/{c.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.memberCount} members &middot; {c.postCount} posts
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {topUsers.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">Top Contributors</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {topUsers.map((u) => (
                  <Card key={u.id} className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
                    <CardContent className="flex items-center gap-3 p-4">
                      <Link href={`/profile/${u.id}`} className="shrink-0">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={u.avatarUrl ?? "/placeholder.svg"} />
                          <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/profile/${u.id}`} className="text-sm font-medium hover:text-white">
                          {u.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{u._count.posts} posts</p>
                      </div>
                      <FollowButton userId={u.id} initialFollowing={false} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
