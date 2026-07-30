export interface PostAuthor {
  id: string
  name: string | null
  avatarUrl: string | null
}

export interface TagInfo {
  tag: { id: string; name: string }
}

export interface PostCommunity {
  id: string
  slug: string
  displayName: string
}

export interface PostData {
  id: string
  title: string
  content: string
  category?: string
  author: PostAuthor
  createdAt: string
  tags: TagInfo[]
  score: number
  userVote: string | null
  commentCount: number
  community?: PostCommunity | null
}

export interface StatsData {
  members: number
  posts: number
}

export interface TagData {
  name: string
  _count: { posts: number }
}

export interface TopUser {
  id: string
  name: string | null
  avatarUrl: string | null
  _count: { posts: number }
}
