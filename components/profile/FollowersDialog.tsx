"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface FollowUser {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

function getInitials(name: string | null) {
  if (!name) return "??";
  return name.substring(0, 2).toUpperCase();
}

interface FollowersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  mode: "followers" | "following";
}

export function FollowersDialog({ open, onOpenChange, userId, mode }: FollowersDialogProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/users/${userId}/${mode}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.data ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [open, userId, mode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "followers" ? "Followers" : "Following"}</DialogTitle>
        </DialogHeader>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {mode === "followers" ? "No followers yet." : "Not following anyone yet."}
            </p>
          ) : (
            users.map((u) => (
              <Link
                key={u.id}
                href={`/profile/${u.id}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={u.avatarUrl ?? "/placeholder.svg"} alt={u.name ?? "User"} />
                  <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{u.name ?? "Unnamed Astronomer"}</span>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
