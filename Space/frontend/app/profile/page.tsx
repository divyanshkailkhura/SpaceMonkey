"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Telescope, Star } from "lucide-react";
import Head from "next/head";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("observations");
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Profile - Astronomy Enthusiast</title>
        <meta name="description" content="User profile page" />
      </Head>
      <div className="mb-8 grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Profile Card */}
        <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="h-32 w-32 border-4 border-purple-500">
                  <AvatarImage src="/placeholder.svg" alt="User" />
                  <AvatarFallback className="text-4xl">SA</AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full bg-background"
                  onClick={() => setIsEditing(true)}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-2xl font-bold">Stella Astronomer</h2>
              <p className="text-muted-foreground">Amateur Astronomer</p>
              <p className="mt-2 text-sm">Location: Star City</p>
              <p className="text-sm">Member since: January 2025</p>
              {isEditing && (
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => setIsEditing(false)}>Save</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div>
          <div className="mb-4 flex border-b border-purple-800/20">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "observations"
                  ? "border-b-2 border-purple-500 text-purple-500"
                  : "text-muted-foreground"
              }`}
              onClick={() => setActiveTab("observations")}
            >
              Observations
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "favorites"
                  ? "border-b-2 border-purple-500 text-purple-500"
                  : "text-muted-foreground"
              }`}
              onClick={() => setActiveTab("favorites")}
            >
              Favorites
            </button>
          </div>

          {activeTab === "observations" && (
            <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Recent Observations</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-4">
                    <Telescope className="h-6 w-6 text-purple-500" />
                    <div>
                      <p className="font-medium">Orion Nebula (M42)</p>
                      <p className="text-sm text-muted-foreground">Observed on June 10, 2025</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-4">
                    <Telescope className="h-6 w-6 text-purple-500" />
                    <div>
                      <p className="font-medium">Andromeda Galaxy (M31)</p>
                      <p className="text-sm text-muted-foreground">Observed on June 5, 2025</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}

          {activeTab === "favorites" && (
            <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Favorite Objects</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-4">
                    <Star className="h-6 w-6 text-purple-500" />
                    <div>
                      <p className="font-medium">Pleiades (M45)</p>
                      <p className="text-sm text-muted-foreground">Open Cluster in Taurus</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-4">
                    <Star className="h-6 w-6 text-purple-500" />
                    <div>
                      <p className="font-medium">Ring Nebula (M57)</p>
                      <p className="text-sm text-muted-foreground">Planetary Nebula in Lyra</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}