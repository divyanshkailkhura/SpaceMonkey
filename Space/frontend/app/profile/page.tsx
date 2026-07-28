"use client";

import { useState, useEffect } from "react";
import { usePageTitle } from "@/lib/page-title";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, Telescope, Star, Plus, Trash2 } from "lucide-react";
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

interface Observation {
  id: string;
  objectName: string;
  objectType: string | null;
  constellation: string | null;
  description: string | null;
  rating: number;
  observedAt: string;
}

interface FavoriteItem {
  id: string;
  objectName: string;
  objectType: string | null;
  createdAt: string;
}

function formatObsDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMemberDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getInitials(name: string | null) {
  if (!name) return "??";
  return name.substring(0, 2).toUpperCase();
}

export default function ProfilePage() {
  usePageTitle("Profile - SpaceMonkey")
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [obsLoading, setObsLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favLoading, setFavLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("observations");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const [logOpen, setLogOpen] = useState(false);
  const [logName, setLogName] = useState("");
  const [logType, setLogType] = useState("");
  const [logConstellation, setLogConstellation] = useState("");
  const [logDescription, setLogDescription] = useState("");
  const [logRating, setLogRating] = useState(3);

  const fetchObservations = () => {
    setObsLoading(true);
    fetch("/api/observations?limit=20")
      .then((r) => r.json())
      .then((d) => setObservations(d.data ?? []))
      .catch(() => {})
      .finally(() => setObsLoading(false));
  };

  const fetchFavorites = () => {
    setFavLoading(true);
    api.get<FavoriteItem[]>("/api/favorites")
      .then((d) => setFavorites(d ?? []))
      .catch(() => {})
      .finally(() => setFavLoading(false));
  };

  useEffect(() => {
    api.get<UserProfile>("/api/users/me").then(setProfile).catch(() => {});
    fetchObservations();
    fetchFavorites();
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
      if (session) session.user.name = updated.name;
      setIsEditing(false);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleLogObservation = async () => {
    if (!logName.trim()) return;
    try {
      await fetch("/api/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectName: logName,
          objectType: logType || null,
          constellation: logConstellation || null,
          description: logDescription || null,
          rating: logRating,
        }),
      });
      setLogOpen(false);
      setLogName("");
      setLogType("");
      setLogConstellation("");
      setLogDescription("");
      setLogRating(3);
      fetchObservations();
    } catch {
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
    <>
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
              <p className="text-sm">Member since: {formatMemberDate(profile.createdAt)}</p>
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
          <div className="mb-4 flex items-center justify-between border-b border-purple-800/20">
            <div className="flex">
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
            <Dialog open={logOpen} onOpenChange={setLogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="mb-2">
                  <Plus className="mr-1 h-4 w-4" /> Log Observation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Log an Observation</DialogTitle>
                  <DialogDescription>Record what you saw in the night sky.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="log-name">Object Name *</Label>
                    <Input id="log-name" placeholder="Orion Nebula" value={logName} onChange={(e) => setLogName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="log-type">Object Type</Label>
                      <Input id="log-type" placeholder="Nebula" value={logType} onChange={(e) => setLogType(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="log-constellation">Constellation</Label>
                      <Input id="log-constellation" placeholder="Orion" value={logConstellation} onChange={(e) => setLogConstellation(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => setLogRating(n)} className="focus:outline-none">
                          <Star className={`h-6 w-6 ${n <= logRating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="log-description">Description</Label>
                    <Textarea id="log-description" placeholder="Describe what you observed..." value={logDescription} onChange={(e) => setLogDescription(e.target.value)} rows={3} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setLogOpen(false)}>Cancel</Button>
                  <Button onClick={handleLogObservation} disabled={!logName.trim()}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {activeTab === "observations" && (
            <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Observations</h3>
                {obsLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : observations.length === 0 ? (
                  <p className="text-muted-foreground">No observations yet. Start exploring the star map or log one above!</p>
                ) : (
                  <div className="space-y-3">
                    {observations.map((obs) => (
                      <div key={obs.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                        <Telescope className="h-6 w-6 text-purple-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{obs.objectName}</p>
                          <p className="text-xs text-muted-foreground">
                            {[obs.objectType, obs.constellation].filter(Boolean).join(" · ")}
                            {" · "}{formatObsDate(obs.observedAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < obs.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "favorites" && (
            <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Favorites</h3>
                {favLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : favorites.length === 0 ? (
                  <p className="text-muted-foreground">No favorites yet. Click objects on the star map to add them!</p>
                ) : (
                  <div className="space-y-3">
                    {favorites.map((fav) => (
                      <div key={fav.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                        <Star className="h-6 w-6 text-purple-500 shrink-0 fill-purple-500" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{fav.objectName}</p>
                          {fav.objectType && <p className="text-xs text-muted-foreground">{fav.objectType}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500"
                          onClick={async () => {
                            await api.delete(`/api/favorites/${fav.id}`);
                            setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div> {/* container */}
    </>
  );
}