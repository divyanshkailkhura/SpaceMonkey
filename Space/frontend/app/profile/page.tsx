"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera } from "lucide-react";
import { api } from "@/lib/api";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  createdAt: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getInitials(name: string | null) {
  if (!name) return "??";
  return name.substring(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("observations");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");

  useEffect(() => {
    api.get<UserProfile>("/api/users/me")
      .then(setProfile)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name ?? "");
      setEditBio(profile.bio ?? "");
      setEditLocation(profile.location ?? "");
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.patch<UserProfile>("/api/users/me", {
        name: editName,
        bio: editBio,
        location: editLocation,
      });
      setProfile(updated);
      if (session) {
        session.user.name = updated.name;
      }
      setIsEditing(false);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="container mx-auto flex items-center justify-center px-4 py-24">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 grid gap-6 md:grid-cols-[300px_1fr]">
        <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="h-32 w-32 border-4 border-purple-500">
                  <AvatarImage src={profile.avatarUrl ?? "/placeholder.svg"} alt={profile.name ?? "User"} />
                  <AvatarFallback className="text-4xl">{getInitials(profile.name)}</AvatarFallback>
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
              <h2 className="text-2xl font-bold">{profile.name ?? "Unnamed Astronomer"}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
              {profile.location && <p className="mt-2 text-sm">Location: {profile.location}</p>}
              <p className="text-sm">Member since: {formatDate(profile.createdAt)}</p>
              {isEditing && (
                <div className="mt-4 w-full space-y-3">
                  <div className="text-left space-y-1">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="text-left space-y-1">
                    <Label htmlFor="edit-bio">Bio</Label>
                    <Textarea id="edit-bio" value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} />
                  </div>
                  <div className="text-left space-y-1">
                    <Label htmlFor="edit-location">Location</Label>
                    <Input id="edit-location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
                <h3 className="text-xl font-semibold mb-4">Observations</h3>
                <p className="text-muted-foreground">No observations yet. Start exploring the star map!</p>
              </CardContent>
            </Card>
          )}

          {activeTab === "favorites" && (
            <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Favorites</h3>
                <p className="text-muted-foreground">No favorites yet. Click objects on the star map to add them!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}