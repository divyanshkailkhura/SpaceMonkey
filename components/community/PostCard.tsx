"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CommunityBadge } from "@/components/community/CommunityBadge"
import { ArrowDown, ArrowUp, MessageSquare, MoreHorizontal } from "lucide-react"
import type { PostData } from "@/lib/shared-types"
import { getInitials, timeAgo } from "@/lib/post-utils"

interface PostCardProps {
  post: PostData
  onVote: (postId: string, type: "UP" | "DOWN") => void
  onDelete?: (postId: string) => void
  onTagClick?: (tagName: string) => void
  disabled?: boolean
}

export function PostCard({ post, onVote, onDelete, onTagClick, disabled }: PostCardProps) {
  return (
    <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
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
                {post.community && (
                  <>
                    <span>·</span>
                    <CommunityBadge id={post.community.id} slug={post.community.slug} displayName={post.community.displayName} />
                  </>
                )}
              </div>
            </div>
          </div>
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={() => onDelete(post.id)}>
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
                className={onTagClick ? "cursor-pointer border-purple-500 text-purple-500 hover:bg-purple-500/10" : "border-purple-500 text-purple-500"}
                onClick={onTagClick ? () => onTagClick(t.tag.name) : undefined}
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
              onClick={() => onVote(post.id, "UP")}
              disabled={disabled}
            >
              <ArrowUp className={`h-4 w-4 ${post.userVote === "UP" ? "text-purple-500" : ""}`} />
            </Button>
            <span className="text-sm min-w-[2rem] text-center font-medium">{post.score}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onVote(post.id, "DOWN")}
              disabled={disabled}
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
  )
}
