"use client"

import { useState } from "react"
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
import { ArrowDown, ArrowUp, ImageIcon, MessageSquare, MoreHorizontal, PenSquare, Search, ThumbsUp } from "lucide-react"

// Sample posts data
const posts = [
  {
    id: 1,
    title: "Captured the Andromeda Galaxy last night!",
    content:
      'After months of preparation, I finally got a clear shot of the Andromeda Galaxy (M31). Used my 8" telescope with a DSLR camera. The conditions were perfect with no moon and clear skies.',
    author: "StarGazer42",
    avatar: "/placeholder.svg",
    timestamp: "2 hours ago",
    upvotes: 128,
    downvotes: 3,
    comments: 24,
    image: "/placeholder.svg?height=400&width=600",
    tags: ["Astrophotography", "Galaxy"],
  },
  {
    id: 2,
    title: "Tips for observing the upcoming meteor shower",
    content:
      "The Perseids are coming up next month! Here are my top tips for getting the best viewing experience: 1) Find a dark location away from city lights, 2) Bring a comfortable chair or blanket, 3) Allow your eyes at least 20 minutes to adjust to the darkness, 4) Look toward the northeast after midnight for best results.",
    author: "MeteorHunter",
    avatar: "/placeholder.svg",
    timestamp: "Yesterday",
    upvotes: 95,
    downvotes: 2,
    comments: 18,
    tags: ["Meteor Shower", "Observation Tips"],
  },
  {
    id: 3,
    title: "Question about telescope eyepieces",
    content:
      "I'm new to astronomy and just got my first telescope (8\" Dobsonian). It came with 25mm and 10mm eyepieces, but I'm looking to expand my collection. What would be the next best eyepiece to add to my kit? Looking for something that would give me good planetary views.",
    author: "NewbieStargazer",
    avatar: "/placeholder.svg",
    timestamp: "2 days ago",
    upvotes: 42,
    downvotes: 0,
    comments: 31,
    tags: ["Equipment", "Question"],
  },
  {
    id: 4,
    title: "Solar prominence captured during yesterday's observation",
    content:
      "Check out this massive solar prominence I captured yesterday using my solar telescope! The Sun has been quite active lately, and this prominence extended almost 50,000 km from the surface. Always remember to use proper solar filters when observing the Sun!",
    author: "SolarObserver",
    avatar: "/placeholder.svg",
    timestamp: "3 days ago",
    upvotes: 87,
    downvotes: 1,
    comments: 12,
    image: "/placeholder.svg?height=400&width=600",
    tags: ["Solar", "Astrophotography"],
  },
]

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("popular")
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

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
          <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
            <DialogTrigger asChild>
              <Button>
                <PenSquare className="mr-2 h-4 w-4" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>
                  Share your astronomy experiences, questions, or discoveries with the community.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="Enter a descriptive title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Share your thoughts, questions, or observations..."
                    className="min-h-[150px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="observation">Observation</SelectItem>
                      <SelectItem value="astrophotography">Astrophotography</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image (Optional)</Label>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" type="button">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Upload Image
                    </Button>
                    <span className="text-sm text-muted-foreground">No file selected</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreatePostOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreatePostOpen(false)}>Post</Button>
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

          {filteredPosts.length > 0 ? (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={post.avatar || "/placeholder.svg"} alt={post.author} />
                          <AvatarFallback>{post.author.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{post.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{post.author}</span>
                            <span>•</span>
                            <span>{post.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>{post.content}</p>
                    {post.image && (
                      <div className="overflow-hidden rounded-md">
                        <img src={post.image || "/placeholder.svg"} alt="Post image" className="w-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="border-purple-500 text-purple-500">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <span>{post.upvotes - post.downvotes}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {post.comments} Comments
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      Save
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <p className="text-muted-foreground">No posts found matching your search</p>
              <Button variant="link" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Community Stats */}
          <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Community Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">12.4k</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">1.2k</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">45.6k</p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">324</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
              </div>
              <Button className="w-full">Join Community</Button>
            </CardContent>
          </Card>

          {/* Popular Tags */}
          <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Popular Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  "Astrophotography",
                  "Telescope",
                  "Planets",
                  "Galaxies",
                  "Meteor Shower",
                  "Solar",
                  "Equipment",
                  "Beginner",
                  "Deep Sky",
                  "Observation",
                ].map((tag, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer border-purple-500 text-purple-500 hover:bg-purple-500/10"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Contributors */}
          <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Top Contributors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["CosmicExplorer", "GalaxyHunter", "StarGazer42", "AstroEnthusiast", "NebulaObserver"].map(
                  (user, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback>{user.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user}</p>
                        <p className="text-xs text-muted-foreground">{100 - i * 15} contributions</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Follow
                      </Button>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
