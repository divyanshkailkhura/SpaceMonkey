/* -------------------------------------------------------------------------- */
/* pages/events/page.tsx                                                      */
/* -------------------------------------------------------------------------- */
"use client";

import React, { useState } from "react";
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
import {
  CalendarDays,
  Moon,
  Star,
  Sun,
  Telescope,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* 1 . Event model + static data (placeholder)                                 */
/* -------------------------------------------------------------------------- */
export interface EventItem {
  id: string;
  date: string;          // ISO date string ‑ yyyy-mm-dd
  time: string;          // Human-readable time
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const events: EventItem[] = [
  {
    id: "1",
    date: "2025-06-21",
    time: "05:00 IST",
    title: "Summer Solstice Sunrise",
    description:
      "The Sun reaches its highest position in the sky marking the beginning of astronomical summer.",
    icon: Sun,
  },
  {
    id: "2",
    date: "2025-08-12",
    time: "22:30 IST",
    title: "Perseid Meteor Shower Peak",
    description:
      "One of the year's most prolific meteor showers, producing up to 100 meteors per hour at its peak.",
    icon: Star,
  },
  {
    id: "3",
    date: "2025-09-07",
    time: "03:17 IST",
    title: "Last-Quarter Moon",
    description:
      "The Moon is three-quarters of the way through its orbit and appears half-illuminated.",
    icon: Moon,
  },
  {
    id: "4",
    date: "2025-10-17",
    time: "20:15 IST",
    title: "Partial Lunar Eclipse",
    description:
      "Earth’s shadow obscures part of the Moon creating a dramatic celestial event visible from India.",
    icon: EclipseIcon,
  },
];

/* Dummy eclipse icon (lucide-react has no “eclipse” glyph) */
function EclipseIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Telescope {...props} />;
}

/* -------------------------------------------------------------------------- */
/* 2 . React component                                                         */
/* -------------------------------------------------------------------------- */
export default function EventsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  /* Events that match the calendar-selected date */
  /* Safe filter – runs only when a date is selected */
const eventsOnDate: EventItem[] = selectedDate
  ? events.filter(
      (evt) =>
        new Date(evt.date).toDateString() === selectedDate.toDateString()
    )
  : [];


  return (
    <main className="p-6">
      <Tabs defaultValue="calendar" className="space-y-4">
        {/* ------------------------------------------------------------------ */}
        {/* Tab Header list (“Calendar / List”)                                 */}
        {/* ------------------------------------------------------------------ */}
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

        {/* ------------------------------------------------------------------ */}
        {/* 3a. Calendar TAB CONTENT                                           */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="calendar">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Event Calendar</CardTitle>
              <CardDescription>
                Select a date to view scheduled celestial events
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-6 md:flex-row">
              {/* Calendar widget */}
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />

              {/* Events for the chosen date */}
              <section className="flex-1">
                <h3 className="mb-4 text-lg font-medium">
                  Events on{" "}
                  {selectedDate
                    ? selectedDate.toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </h3>

                <div className="space-y-4">
                  {eventsOnDate.map((evt) => (
                    <article
                      key={evt.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50"
                    >
                      <span className="flex items-center gap-3">
                        <span className="rounded-full bg-primary/10 p-2">
                          <evt.icon className="size-5 text-primary" />
                        </span>
                        <span>
                          <h4 className="font-medium">{evt.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {evt.time}
                          </p>
                        </span>
                      </span>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEvent(evt)}
                      >
                        Details
                      </Button>
                    </article>
                  ))}

                  {selectedDate && eventsOnDate.length === 0 && (
                    <p className="text-center text-muted-foreground">
                      No events on this date
                    </p>
                  )}
                </div>
              </section>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* 3b. List TAB CONTENT                                               */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="list">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>All Upcoming Events</CardTitle>
              <CardDescription>
                Browse the complete list of scheduled celestial events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {events.map((evt) => (
                  <li
                    key={evt.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50"
                  >
                    <span className="flex items-center gap-3">
                      <evt.icon className="size-5 text-primary" />
                      <span>{evt.title}</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEvent(evt)}
                    >
                      Details
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* -------------------------------------------------------------------- */}
      {/* 4 . Event Details Modal                                              */}
      {/* -------------------------------------------------------------------- */}
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

/* -------------------------------------------------------------------------- */
/* Utility icon used in TabsTrigger “List View”                               */
/* -------------------------------------------------------------------------- */
function ListIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}
