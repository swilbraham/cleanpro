"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput, EventDropArg, DatesSetArg } from "@fullcalendar/core";
import { useToast } from "@/components/ui/toast";

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "#3b82f6",
  IN_PROGRESS: "#f59e0b",
  COMPLETED: "#22c55e",
  CANCELLED: "#ef4444",
  INVOICED: "#8b5cf6",
};

interface CalendarJob {
  id: string;
  jobNumber: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string | null;
  duration: number;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  property: {
    id: string;
    address: string;
  } | null;
  assignedTo: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

export function JobCalendar() {
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventInput[]>([]);
  const calendarRef = useRef<FullCalendar>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });

  const fetchJobs = useCallback(
    async (from: string, to: string) => {
      try {
        const params = new URLSearchParams({ from, to, limit: "500" });
        const res = await fetch(`/api/jobs?${params}`);
        if (!res.ok) throw new Error("Failed to fetch jobs");
        const data = await res.json();

        const calendarEvents: EventInput[] = data.jobs.map(
          (job: CalendarJob) => {
            const color = STATUS_COLORS[job.status] || "#6b7280";
            let start: string;

            if (job.scheduledTime) {
              const date = job.scheduledDate.split("T")[0];
              start = `${date}T${job.scheduledTime}`;
            } else {
              start = job.scheduledDate;
            }

            const endDate = new Date(start);
            endDate.setMinutes(endDate.getMinutes() + (job.duration || 60));

            return {
              id: job.id,
              title: `${job.jobNumber} - ${job.customer.firstName} ${job.customer.lastName}`,
              start,
              end: job.scheduledTime ? endDate.toISOString() : undefined,
              allDay: !job.scheduledTime,
              backgroundColor: color,
              borderColor: color,
              extendedProps: {
                status: job.status,
                jobNumber: job.jobNumber,
                customerName: `${job.customer.firstName} ${job.customer.lastName}`,
                address: job.property?.address || "",
                assignedTo: job.assignedTo?.name || "Unassigned",
              },
            };
          }
        );

        setEvents(calendarEvents);
      } catch (error) {
        console.error("Failed to fetch calendar jobs:", error);
        toast("Failed to load calendar events", "error");
      }
    },
    [toast]
  );

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchJobs(dateRange.from, dateRange.to);
    }
  }, [dateRange, fetchJobs]);

  const handleDatesSet = (arg: DatesSetArg) => {
    const from = arg.start.toISOString().split("T")[0];
    const to = arg.end.toISOString().split("T")[0];
    setDateRange({ from, to });
  };

  const handleEventClick = (info: { event: { id: string } }) => {
    router.push(`/jobs/${info.event.id}`);
  };

  const handleEventDrop = async (info: EventDropArg) => {
    const jobId = info.event.id;
    const newStart = info.event.start;

    if (!newStart) {
      info.revert();
      return;
    }

    const scheduledDate = newStart.toISOString().split("T")[0];
    const scheduledTime = info.event.allDay
      ? null
      : `${String(newStart.getHours()).padStart(2, "0")}:${String(newStart.getMinutes()).padStart(2, "0")}`;

    try {
      const body: any = { scheduledDate };
      if (scheduledTime !== null) {
        body.scheduledTime = scheduledTime;
      }

      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Failed to reschedule");
      }

      toast("Job rescheduled");
    } catch {
      info.revert();
      toast("Failed to reschedule job", "error");
    }
  };

  return (
    <div className="job-calendar">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,timeGridDay",
        }}
        events={events}
        editable={true}
        droppable={true}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        datesSet={handleDatesSet}
        slotMinTime="06:00:00"
        slotMaxTime="21:00:00"
        allDaySlot={true}
        nowIndicator={true}
        height="auto"
        eventDisplay="block"
        dayMaxEvents={true}
        weekends={true}
        firstDay={1}
        slotDuration="00:30:00"
        eventContent={(arg) => {
          const props = arg.event.extendedProps;
          return (
            <div className="p-1 text-xs leading-tight overflow-hidden">
              <div className="font-semibold truncate">
                {props.jobNumber}
              </div>
              <div className="truncate">{props.customerName}</div>
              {props.address && (
                <div className="truncate opacity-80">{props.address}</div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
