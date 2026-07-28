import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = await getDb();

  const favorite = await db.favoriteObject.findUnique({ where: { id } });
  if (!favorite) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (favorite.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.favoriteObject.delete({ where: { id } });
  return NextResponse.json({ data: null });
}