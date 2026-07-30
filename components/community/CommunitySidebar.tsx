"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus } from "lucide-react";
import { api } from "@/lib/api";

interface CommunitySummary {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  memberCount: number;
  postCount: number;
}

interface CommunitySidebarProps {
  onCreateClick: () => void;
}

export function CommunitySidebar({ onCreateClick }: CommunitySidebarProps) {
  const [communities, setCommunities] = useState<CommunitySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<CommunitySummary[]>("/api/communities")
      .then(setCommunities)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="border-purple-800/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Communities</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCreateClick} title="Create a community">
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="h-10 w-full animate-pulse rounded-lg bg-slate-800" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-slate-800" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-slate-800" />
          </div>
        ) : communities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No communities yet. <Button variant="link" className="p-0 h-auto" onClick={onCreateClick}>Create the first one!</Button>
          </p>
        ) : (
          <div className="space-y-2">
            {communities.map((c) => (
              <Link
                key={c.id}
                href={`/c/${c.slug}`}
                className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-purple-500/10"
              >
                <Users className="h-4 w-4 text-purple-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">c/{c.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.memberCount} members · {c.postCount} posts
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
