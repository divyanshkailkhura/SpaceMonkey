import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const db = await getDb();

  const community = await db.community.findUnique({ where: { slug } });
  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const existing = await db.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId: session.user.id } },
  });

  if (existing) {
    await db.communityMember.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ data: { joined: false } });
  }

  await db.communityMember.create({
    data: {
      communityId: community.id,
      userId: session.user.id,
      role: "MEMBER",
    },
  });

  return NextResponse.json({ data: { joined: true } });
}
