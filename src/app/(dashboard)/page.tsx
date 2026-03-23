"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatTime } from "@/lib/formatters";
import {
  Plus,
  Users,
  MapPin,
  PoundSterling,
  AlertCircle,
  Briefcase,
  ArrowRight,
  Inbox,
  Calendar,
} from "lucide-react";
import type { DashboardStats } from "@/types";

const statusColors: Record<string, "default" | "info" | "warning" | "success" | "destructive"> = {
  SCHEDULED: "info",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
  INVOICED: "default",
};

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/quotes/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> New Quote
            </Button>
          </Link>
          <Link href="/customers/new">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-1" /> New Customer
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards - 2x2 on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Today&apos;s Jobs</span>
              <Briefcase className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </div>
            <div className="text-xl sm:text-2xl font-bold">
              {stats?.todayJobs.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.weekJobCount || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Revenue</span>
              <PoundSterling className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </div>
            <div className="text-xl sm:text-2xl font-bold truncate">
              {formatCurrency(stats?.revenueToday || 0)}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {formatCurrency(stats?.revenueMonth || 0)} /month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Outstanding</span>
              <AlertCircle className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </div>
            <div className="text-xl sm:text-2xl font-bold truncate">
              {formatCurrency(stats?.outstandingTotal || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.outstandingCount || 0} unpaid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Overdue</span>
              <AlertCircle className="h-4 w-4 text-destructive hidden sm:block" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-destructive truncate">
              {formatCurrency(stats?.overdueTotal || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.overdueCount || 0} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - compact on mobile */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <Link href="/requests/new">
          <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all h-full">
            <CardContent className="flex flex-col items-center gap-1.5 p-3 sm:gap-3 sm:p-6">
              <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10">
                <Inbox className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
              <span className="text-[11px] sm:text-sm font-medium text-center leading-tight">New Request</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/jobs/new">
          <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all h-full">
            <CardContent className="flex flex-col items-center gap-1.5 p-3 sm:gap-3 sm:p-6">
              <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10">
                <Briefcase className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
              <span className="text-[11px] sm:text-sm font-medium text-center leading-tight">New Job</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/calendar">
          <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all h-full">
            <CardContent className="flex flex-col items-center gap-1.5 p-3 sm:gap-3 sm:p-6">
              <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
              <span className="text-[11px] sm:text-sm font-medium text-center leading-tight">Calendar</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/route-planner">
          <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all h-full">
            <CardContent className="flex flex-col items-center gap-1.5 p-3 sm:gap-3 sm:p-6">
              <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
              <span className="text-[11px] sm:text-sm font-medium text-center leading-tight">Route</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Today's Jobs + Revenue */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Today&apos;s Jobs</CardTitle>
            <Link href="/route-planner">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Route
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!stats?.todayJobs.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No jobs scheduled for today
              </p>
            ) : (
              <div className="space-y-2">
                {stats.todayJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-md border hover:bg-muted/50 transition-colors min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {job.customer.firstName} {job.customer.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {job.scheduledTime
                          ? formatTime(job.scheduledTime)
                          : "No time"}{" "}
                        · {job.customer.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge variant={statusColors[job.status]} className="text-[10px] sm:text-xs">
                        {job.status.replace("_", " ")}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground hidden sm:block" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Summary */}
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Revenue Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Today</span>
                <span className="font-semibold text-sm">
                  {formatCurrency(stats?.revenueToday || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Week</span>
                <span className="font-semibold text-sm">
                  {formatCurrency(stats?.revenueWeek || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="font-semibold text-sm">
                  {formatCurrency(stats?.revenueMonth || 0)}
                </span>
              </div>
              <hr />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Outstanding</span>
                <span className="font-semibold text-sm text-orange-600">
                  {formatCurrency(stats?.outstandingTotal || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overdue</span>
                <span className="font-semibold text-sm text-destructive">
                  {formatCurrency(stats?.overdueTotal || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
