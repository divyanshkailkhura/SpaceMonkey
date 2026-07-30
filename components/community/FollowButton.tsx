"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface FollowButtonProps {
  userId: string;
  initialFollowing: boolean;
  onToggle?: (following: boolean) => void;
}

export function FollowButton({ userId, initialFollowing, onToggle }: FollowButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  if (!session || session.user.id === userId) return null;

  const handleClick = async () => {
    if (!session) {
      router.push("/auth");
      return;
    }
    setLoading(true);
    try {
      const result = await api.post<{ following: boolean }>(`/api/users/${userId}/follow`);
      setFollowing(result.following);
      onToggle?.(result.following);
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-1"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : following ? (
        <>
          <UserMinus className="h-3 w-3" /> Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-3 w-3" /> Follow
        </>
      )}
    </Button>
  );
}
