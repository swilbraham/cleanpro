"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/formatters";
import {
  Clock,
  Play,
  Square,
  Filter,
  Timer,
  Trash2,
  User,
} from "lucide-react";

interface TimeEntry {
  id: string;
  userId: string;
  jobId: string | null;
  clockIn: string;
  clockOut: string | null;
  duration: number | null;
  notes: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  job: {
    id: string;
    jobNumber: string;
    customer: {
      firstName: string;
      lastName: string;
    };
  } | null;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function formatClockTime(dateStr: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function getElapsedSeconds(clockIn: string): number {
  return Math.floor((Date.now() - new Date(clockIn).getTime()) / 1000);
}

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function TimeSheetsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterUserId, setFilterUserId] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const userId = (session?.user as { id?: string } | undefined)?.id;

  const fetchEntries = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (filterUserId) params.set("userId", filterUserId);

      const res = await fetch(`/api/timesheets?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEntries(data.entries);

      // Find active entry for current user
      if (userId) {
        const active = data.entries.find(
          (e: TimeEntry) => e.userId === userId && !e.clockOut
        );
        setActiveEntry(active || null);
      }
    } catch (error) {
      console.error("Failed to fetch time entries:", error);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, filterUserId, userId]);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      if (!res.ok) return;
      const data = await res.json();
      setTeamMembers(data.members || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchTeam();
  }, [fetchEntries, fetchTeam]);

  // Timer for elapsed time
  useEffect(() => {
    if (activeEntry) {
      setElapsed(getElapsedSeconds(activeEntry.clockIn));
      timerRef.current = setInterval(() => {
        setElapsed(getElapsedSeconds(activeEntry.clockIn));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeEntry]);

  const handleClockToggle = async () => {
    if (!userId) {
      toast("You must be logged in to clock in/out", "error");
      return;
    }
    setClockLoading(true);
    try {
      const res = await fetch("/api/timesheets/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to toggle clock");
      }
      const data = await res.json();
      if (data.action === "clocked_in") {
        toast("Clocked in successfully");
        setActiveEntry(data.entry);
      } else {
        toast(
          `Clocked out. Duration: ${formatDuration(data.entry.duration || 0)}`
        );
        setActiveEntry(null);
      }
      fetchEntries();
    } catch (error: any) {
      toast(error.message || "Failed to toggle clock", "error");
    } finally {
      setClockLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this time entry?")) return;
    try {
      const res = await fetch(`/api/timesheets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast("Time entry deleted");
      fetchEntries();
    } catch {
      toast("Failed to delete time entry", "error");
    }
  };

  const handleFilter = () => {
    setLoading(true);
    fetchEntries();
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setFilterUserId("");
    setLoading(true);
  };

  // Clear filters triggers re-fetch via useCallback dependency
  useEffect(() => {
    if (!dateFrom && !dateTo && !filterUserId && !loading) {
      fetchEntries();
    }
  }, [dateFrom, dateTo, filterUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Sheets</h1>
          <p className="text-muted-foreground">
            Track work hours and manage timesheets
          </p>
        </div>
      </div>

      {/* Clock In/Out Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {activeEntry ? "Currently Clocked In" : "Not Clocked In"}
                </h2>
                {activeEntry && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    <span className="font-mono text-lg">
                      {formatElapsed(elapsed)}
                    </span>
                    <span className="text-sm">
                      (since {formatClockTime(activeEntry.clockIn)})
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleClockToggle}
              disabled={clockLoading || !userId}
              className={
                activeEntry
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }
            >
              {activeEntry ? (
                <>
                  <Square className="mr-2 h-5 w-5" />
                  Clock Out
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Clock In
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">
                Team Member
              </label>
              <Select
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
              >
                <option value="">All Members</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.email}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleFilter} variant="outline">
                Apply
              </Button>
              <Button onClick={clearFilters} variant="ghost">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">
                Loading time entries...
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No time entries</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Clock in to start tracking your time.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="space-y-3 lg:hidden">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {formatDate(entry.clockIn)}
                      </span>
                      {!entry.clockOut && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      {entry.user.name || entry.user.email}
                    </div>
                    {entry.job && (
                      <div className="text-sm text-muted-foreground">
                        Job: {entry.job.jobNumber} -{" "}
                        {entry.job.customer.firstName}{" "}
                        {entry.job.customer.lastName}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {formatClockTime(entry.clockIn)}
                        {" - "}
                        {entry.clockOut
                          ? formatClockTime(entry.clockOut)
                          : "In progress"}
                      </span>
                      <span className="font-medium">
                        {entry.duration
                          ? formatDuration(entry.duration)
                          : "--"}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground">
                        {entry.notes}
                      </p>
                    )}
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Team Member</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.clockIn)}</TableCell>
                        <TableCell>
                          {entry.user.name || entry.user.email}
                        </TableCell>
                        <TableCell>
                          {entry.job ? (
                            <span>
                              {entry.job.jobNumber} -{" "}
                              {entry.job.customer.firstName}{" "}
                              {entry.job.customer.lastName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{formatClockTime(entry.clockIn)}</TableCell>
                        <TableCell>
                          {entry.clockOut ? (
                            formatClockTime(entry.clockOut)
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
                              Active
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {entry.duration
                            ? formatDuration(entry.duration)
                            : "--"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {entry.notes || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
