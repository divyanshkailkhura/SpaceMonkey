"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Users } from "lucide-react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  isFollowing: boolean
}

export function CommandSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [communities, setCommunities] = useState<CommunityResult[]>([])
  const [users, setUsers] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setCommunities([])
      setUsers([])
      return
    }
    setLoading(true)
    try {
      const [commRes, userRes] = await Promise.all([
        fetch(`/api/communities?search=${encodeURIComponent(q.trim())}`),
        fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}&limit=8`),
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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const hasCommunities = communities.length > 0
  const hasUsers = users.length > 0
  const isEmpty = !loading && query.trim() && !hasCommunities && !hasUsers

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search communities and users..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isEmpty && <CommandEmpty>No results found.</CommandEmpty>}
        {!query.trim() && (
          <CommandEmpty>Type to search communities and users...</CommandEmpty>
        )}
        {loading && !hasCommunities && !hasUsers && (
          <CommandEmpty>Searching...</CommandEmpty>
        )}

        {hasCommunities && (
          <CommandGroup heading="Communities">
            {communities.map((c) => (
              <CommandItem
                key={c.id}
                value={`community-${c.slug}`}
                onSelect={() => {
                  setOpen(false)
                  router.push(`/c/${c.slug}`)
                }}
              >
                <Users className="h-4 w-4 text-purple-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium">c/{c.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.memberCount} members &middot; {c.postCount} posts
                    {c.joined && " \u00b7 Joined"}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {hasUsers && (
          <CommandGroup heading="Users">
            {users.map((u) => (
              <CommandItem
                key={u.id}
                value={`user-${u.name ?? u.id}`}
                onSelect={() => {
                  setOpen(false)
                  router.push(`/profile/${u.id}`)
                }}
              >
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={u.avatarUrl ?? "/placeholder.svg"} />
                  <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium">{u.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {u.postCount} posts &middot; {u.followerCount} followers
                    {u.isFollowing && " \u00b7 Following"}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
