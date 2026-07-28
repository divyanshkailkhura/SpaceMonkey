import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();

  const [members, posts] = await Promise.all([
    db.user.count(),
    db.post.count(),
  ]);

  return NextResponse.json({
    data: { members, posts },
  });
}