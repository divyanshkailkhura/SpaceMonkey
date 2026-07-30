"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { CATEGORY_OPTIONS } from "@/lib/post-utils"

interface CreatePostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPostCreated: () => void
  communityId?: string
  communityName?: string
}

export function CreatePostDialog({ open, onOpenChange, onPostCreated, communityId, communityName }: CreatePostDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("OTHER")
  const [tags, setTags] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  const resetForm = () => {
    setTitle("")
    setContent("")
    setCategory("OTHER")
    setTags("")
    setCreateError("")
  }

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return
    setCreateError("")
    setCreating(true)
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
      await api.post("/api/posts", {
        title,
        content,
        category,
        tags: tagList,
        communityId: communityId ?? undefined,
      })
      onOpenChange(false)
      resetForm()
      onPostCreated()
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create post")
    } finally {
      setCreating(false)
    }
  }

  const titleText = communityName
    ? `Create Post in c/${communityName}`
    : "Create New Post"

  const descText = communityName
    ? "Share your thoughts with the community."
    : "Share your astronomy experiences, questions, or discoveries."

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm() }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
          <DialogDescription>{descText}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="create-title">Title</Label>
            <Input id="create-title" placeholder="Enter a descriptive title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-content">Content</Label>
            <Textarea id="create-content" placeholder="Share your thoughts..." className="min-h-[150px]" value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
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
            <Label htmlFor="create-tags">Tags (comma-separated)</Label>
            <Input id="create-tags" placeholder="Galaxy, Astrophotography" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
        </div>
        {createError && (
          <p className="text-sm text-red-500 text-center">{createError}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={creating}>{creating ? "Posting..." : "Post"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
