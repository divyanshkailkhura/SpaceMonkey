import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Compass, Users, Star, ArrowRight } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Astronomer!</p>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href="/map">
              <Compass className="mr-2 h-4 w-4" />
              Explore Star Map
            </Link>
          </Button>
          <Button asChild>
            <Link href="/community">
              <Users className="mr-2 h-4 w-4" />
              View Community
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* User Profile Card */}
        <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-purple-500">
              <AvatarImage src="/placeholder.svg" alt="User" />
              <AvatarFallback>UN</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>Stella Astronomer</CardTitle>
              <CardDescription>Joined January 2023</CardDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-purple-500 text-purple-500">
                  Stargazer
                </Badge>
                <Badge variant="outline" className="border-blue-500 text-blue-500">
                  Lunar Observer
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-xs text-muted-foreground">Observations</p>
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Events Attended</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/profile">View Full Profile</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Stargazing Logs Preview */}
        <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="mr-2 h-5 w-5 text-yellow-500" />
              Recent Stargazing Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "Orion Nebula Observation", date: "Mar 15, 2023", rating: 5 },
              { title: "Jupiter and Its Moons", date: "Feb 28, 2023", rating: 4 },
              { title: "Andromeda Galaxy", date: "Feb 10, 2023", rating: 5 },
            ].map((log, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50"
              >
                <div>
                  <h4 className="font-medium">{log.title}</h4>
                  <p className="text-xs text-muted-foreground">{log.date}</p>
                </div>
                <div className="flex">
                  {Array(log.rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/logs">
                View All Logs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Upcoming Events Preview */}
        <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-blue-500" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "Meteor Shower", date: "Apr 22, 2023", type: "Meteor" },
              { title: "Solar Eclipse", date: "May 15, 2023", type: "Eclipse" },
              { title: "Mars Opposition", date: "Jun 8, 2023", type: "Planetary" },
            ].map((event, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50"
              >
                <div>
                  <h4 className="font-medium">{event.title}</h4>
                  <p className="text-xs text-muted-foreground">{event.date}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    event.type === "Meteor"
                      ? "border-green-500 text-green-500"
                      : event.type === "Eclipse"
                        ? "border-orange-500 text-orange-500"
                        : "border-blue-500 text-blue-500"
                  }
                >
                  {event.type}
                </Badge>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/events">
                View All Events <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8">
        <h2 className="mb-4 text-2xl font-bold">Recent Community Activity</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              user: "CosmicExplorer",
              avatar: "/placeholder.svg",
              action: "posted",
              content: "Amazing view of Saturn's rings last night!",
              time: "2 hours ago",
              likes: 24,
            },
            {
              user: "StarGazer42",
              avatar: "/placeholder.svg",
              action: "shared",
              content: "Tips for photographing the Milky Way",
              time: "5 hours ago",
              likes: 18,
            },
          ].map((activity, i) => (
            <Card key={i} className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={activity.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{activity.user.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{activity.user}</span>
                      <span className="text-xs text-muted-foreground">{activity.action}</span>
                    </div>
                    <p className="mt-1">{activity.content}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                      <span className="flex items-center text-xs">
                        <Star className="mr-1 h-3 w-3 fill-yellow-500 text-yellow-500" />
                        {activity.likes} likes
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
