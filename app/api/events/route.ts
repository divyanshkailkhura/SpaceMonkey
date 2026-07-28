import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const db = await getDb();

  const where: Record<string, unknown> = {};
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.date = { gte: start, lt: end };
  }

  const events = await db.event.findMany({
    where,
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ data: events });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, date, time, eventType } = await req.json();

  if (!title?.trim() || !date) {
    return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
  }

  const db = await getDb();

  const event = await db.event.create({
    data: {
      title: title.trim(),
      description: description?.trim() ?? "",
      date: new Date(date),
      time: time?.trim() ?? "TBD",
      eventType: eventType ?? "OTHER",
    },
  });

  return NextResponse.json({ data: event }, { status: 201 });
}