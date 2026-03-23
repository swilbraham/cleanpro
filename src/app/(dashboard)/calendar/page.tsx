"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobCalendar } from "@/components/calendar/job-calendar";
import { List, Plus } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            View and manage job schedule
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/jobs">
            <Button variant="outline">
              <List className="mr-2 h-4 w-4" />
              List View
            </Button>
          </Link>
          <Link href="/jobs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-muted-foreground">Status:</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-[#3b82f6]" />
          Scheduled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-[#f59e0b]" />
          In Progress
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-[#22c55e]" />
          Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-[#ef4444]" />
          Cancelled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-[#8b5cf6]" />
          Invoiced
        </span>
      </div>

      <Card>
        <CardContent className="pt-6">
          <JobCalendar />
        </CardContent>
      </Card>
    </div>
  );
}
