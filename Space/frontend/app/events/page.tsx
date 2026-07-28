"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarDays, Moon, Star, Sun, Telescope, Loader2 } from "lucide-react";

interface EventItem {
  id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  eventType: string;
}

const EVENT_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  METEOR: Star,
  ECLIPSE: Telescope,
  PLANETARY: Sun,
  LUNAR: Moon,
  SOLAR: Sun,
};

function EventIcon({ type, className }: { type: string; className?: string }) {
  const Icon = EVENT_ICONS[type] ?? Telescope;
  return <Icon className={className} />;
}

function fmtDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function fmtDisplay(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function fmtFull(date: Date) {
  return date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [viewingMonth, setViewingMonth] = useState<Date>(new Date());

  useEffect(() => {
    setLoading(true);
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => setEvents(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const eventsOnDate = useMemo(() => {
    if (!selectedDate) return [];
    const target = fmtDate(selectedDate);
    return events.filter((e) => e.date.startsWith(target));
  }, [events, selectedDate]);

  const currentMonthEvents = useMemo(() => {
    const ym = fmtDate(viewingMonth).slice(0, 7);
    return events.filter((e) => e.date.startsWith(ym)).sort((a, b) => a.date.localeCompare(b.date));
  }, [events, viewingMonth]);

  const eventDates = events.map((e) => new Date(e.date));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">
            <CalendarDays className="mr-2 size-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list">
            <ListIcon className="mr-2 size-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Event Calendar</CardTitle>
              <CardDescription>
                Highlighted dates have celestial events. Click a date to filter.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-6 md:flex-row">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={viewingMonth}
                onMonthChange={setViewingMonth}
                className="rounded-md border"
                modifiers={{ event: eventDates }}
                modifiersClassNames={{ event: "font-bold text-purple-500 underline" }}
              />

              <section className="flex-1 min-w-0">
                <h3 className="mb-4 text-lg font-medium">
                  {selectedDate
                    ? `Events on ${fmtFull(selectedDate)}`
                    : `Events in ${fmtDisplay(viewingMonth)}`}
                </h3>

                <div className="space-y-2">
                  {(selectedDate ? eventsOnDate : currentMonthEvents).map((evt) => (
                    <article
                      key={evt.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 cursor-pointer"
                      onClick={() => setSelectedEvent(evt)}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="rounded-full bg-primary/10 p-2 shrink-0">
                          <EventIcon type={evt.eventType} className="size-5 text-primary" />
                        </span>
                        <span className="min-w-0">
                          <h4 className="font-medium truncate">{evt.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(evt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {" · "}{evt.time}
                          </p>
                        </span>
                      </span>
                    </article>
                  ))}

                  {((selectedDate && eventsOnDate.length === 0) || (!selectedDate && currentMonthEvents.length === 0)) && (
                    <p className="text-center text-muted-foreground py-4">
                      {selectedDate ? "No events on this date" : "No events this month"}
                    </p>
                  )}
                </div>
              </section>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card className="bg-card/50 backdrop-blur-sm max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>All Upcoming Events</CardTitle>
              <CardDescription>
                Browse the complete list of scheduled celestial events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No events scheduled yet.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 cursor-pointer"
                      onClick={() => setSelectedEvent(evt)}
                    >
                      <EventIcon type={evt.eventType} className="size-5 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium truncate">{evt.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(evt.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {" · "}{evt.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm px-4">
          <div className="max-w-lg w-full rounded-xl bg-background p-6 shadow-xl">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
              <button
                aria-label="Close details"
                onClick={() => setSelectedEvent(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </header>

            <p className="mb-1">
              <strong>Date:</strong>{" "}
              {new Date(selectedEvent.date).toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="mb-1">
              <strong>Time:</strong> {selectedEvent.time}
            </p>
            <p className="mt-3 whitespace-pre-wrap">{selectedEvent.description}</p>

            <footer className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedEvent(null)}>Close</Button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}

function ListIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} strokeWidth={1.5} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}