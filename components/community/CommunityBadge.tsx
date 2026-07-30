import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface CommunityBadgeProps {
  id: string;
  slug: string;
  displayName: string;
}

export function CommunityBadge({ slug, displayName }: CommunityBadgeProps) {
  return (
    <Link href={`/c/${slug}`}>
      <Badge variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 cursor-pointer">
        c/{displayName}
      </Badge>
    </Link>
  );
}
