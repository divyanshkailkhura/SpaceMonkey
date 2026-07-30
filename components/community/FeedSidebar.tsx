"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CommunitySidebar } from "@/components/community/CommunitySidebar"
import { FollowButton } from "@/components/community/FollowButton"
import { api } from "@/lib/api"
import type { StatsData, TagData, TopUser } from "@/lib/shared-types"
import { getInitials } from "@/lib/post-utils"

interface FeedSidebarProps {
  onTagClick?: (tagName: string) => void
  onCreateCommunity: () => void
}

export function FeedSidebar({ onTagClick, onCreateCommunity }: FeedSidebarProps) {
  const [stats, setStats] = useState<StatsData>({ members: 0, posts: 0 })
  const [popTags, setPopTags] = useState<TagData[]>([])
  const [topUsers, setTopUsers] = useState<TopUser[]>([])

  useEffect(() => {
    api.get<StatsData>("/api/stats").then(setStats).catch(() => {})
    api.get<TagData[]>("/api/tags").then(setPopTags).catch(() => {})
    api.get<TopUser[]>("/api/users/top").then(setTopUsers).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <CommunitySidebar onCreateClick={onCreateCommunity} />

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
                  onClick={onTagClick ? () => onTagClick(tag.name) : undefined}
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
                  <Link href={`/profile/${user.id}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl ?? "/placeholder.svg"} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <Link href={`/profile/${user.id}`} className="text-sm font-medium hover:text-white">
                      {user.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{user._count.posts} posts</p>
                  </div>
                  <FollowButton userId={user.id} initialFollowing={false} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export type { FeedSidebarProps }
