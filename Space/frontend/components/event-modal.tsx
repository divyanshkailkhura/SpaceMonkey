"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPin, Bell, Share } from "lucide-react"

interface EventModalProps {
  event: {
    id: number
    title: string
    type: string
    date: string
    time: string
    visibility: string
    description: string
    location: string
  }
  onClose: () => void
}

export function EventModal({ event, onClose }: EventModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{event.title}</DialogTitle>
              <DialogDescription className="mt-2">
                <Badge
                  variant="outline"
                  className={
                    event.type === "Meteor Shower"
                      ? "border-green-500 text-green-500"
                      : event.type === "Eclipse"
                        ? "border-orange-500 text-orange-500"
                        : event.type === "Lunar Event"
                          ? "border-blue-500 text-blue-500"
                          : "border-purple-500 text-purple-500"
                  }
                >
                  {event.type}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{event.date}</p>
                <p className="text-xs text-muted-foreground">{event.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Visibility</p>
                <p className="text-xs text-muted-foreground">{event.visibility}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-medium">Location</h4>
            <p className="text-sm text-muted-foreground">{event.location}</p>
          </div>

          <div>
            <h4 className="mb-2 font-medium">Description</h4>
            <p className="text-sm text-muted-foreground">{event.description}</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 font-medium">Viewing Tips</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Find a location away from city lights</li>
              <li>• Allow 20-30 minutes for your eyes to adjust to darkness</li>
              <li>• Check weather conditions before heading out</li>
              <li>• Bring a red flashlight to preserve night vision</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Share className="h-4 w-4" />
            Share
          </Button>
          <Button className="gap-2">
            <Bell className="h-4 w-4" />
            Set Reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
