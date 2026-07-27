"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Compass, Users, Star, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface DashboardStats {
  observations: number;
  posts: number;
}

function getInitials(name: string | null) {
  if (!name) return "??";
  return name.substring(0, 2).toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats] = useState<DashboardStats>({ observations: 0, posts: 0 });

  useEffect(() => {
    api.get<UserProfile>("/api/users/me")
      .then(setProfile)
      .catch(() => {});
  }, []);

  const displayName = session?.user?.name ?? profile?.name ?? "Astronomer";
  const initials = getInitials(profile?.name ?? null);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {displayName}!</p>
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
        <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-purple-500">
              <AvatarImage src={profile?.avatarUrl ?? "/placeholder.svg"} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{displayName}</CardTitle>
              <CardDescription>
                {profile ? `Joined ${formatDate(profile.createdAt)}` : "Loading..."}
              </CardDescription>
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
                <p className="text-2xl font-bold">{stats.observations}</p>
                <p className="text-xs text-muted-foreground">Observations</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.posts}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/profile">View Full Profile</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="mr-2 h-5 w-5 text-yellow-500" />
              Stargazing Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No observation logs yet. Use the star map to start recording what you see!
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/map">
                Open Star Map <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-blue-500" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Celestial event calendar coming soon. Check back for meteor showers, eclipses, and more!
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/events">
                View Events <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}