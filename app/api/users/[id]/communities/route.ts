import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const db = await getDb();

  const user = await db.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const memberships = await db.communityMember.findMany({
    where: { userId: id },
    include: {
      community: { select: { id: true, slug: true, displayName: true, description: true } },
    },
    orderBy: { joinedAt: "desc" },
  });

  const data = memberships.map((m) => ({
    id: m.community.id,
    slug: m.community.slug,
    displayName: m.community.displayName,
    description: m.community.description,
    role: m.role,
    joinedAt: m.joinedAt,
  }));

  return NextResponse.json({ data });
}
