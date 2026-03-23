"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatTime } from "@/lib/formatters";
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.todayJobs.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.weekJobCount || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.revenueToday || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.revenueMonth || 0)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.outstandingTotal || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.outstandingCount || 0} unpaid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(stats?.overdueTotal || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.overdueCount || 0} overdue invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link href="/requests/new">
          <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all">
            <CardContent className="flex flex-col items-center gap-3 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Inbox className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium">New Request</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/jobs/new">
          <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all">
            <CardContent className="flex flex-col items-center gap-3 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium">New Job</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/calendar">
          <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all">
            <CardContent className="flex flex-col items-center gap-3 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium">View Calendar</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/route-planner">
          <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all">
            <CardContent className="flex flex-col items-center gap-3 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium">View Route</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Today's Jobs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today&apos;s Jobs</CardTitle>
            <Link href="/route-planner">
              <Button variant="outline" size="sm">
                <MapPin className="h-4 w-4 mr-1" /> View Route
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!stats?.todayJobs.length ? (
              <p className="text-sm text-muted-foreground">
                No jobs scheduled for today
              </p>
            ) : (
              <div className="space-y-3">
                {stats.todayJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {job.customer.firstName} {job.customer.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.scheduledTime
                          ? formatTime(job.scheduledTime)
                          : "No time set"}{" "}
                        - {job.customer.address}, {job.customer.postcode}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColors[job.status]}>
                        {job.status.replace("_", " ")}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Revenue Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Today</span>
                <span className="font-semibold">
                  {formatCurrency(stats?.revenueToday || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Week</span>
                <span className="font-semibold">
                  {formatCurrency(stats?.revenueWeek || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="font-semibold">
                  {formatCurrency(stats?.revenueMonth || 0)}
                </span>
              </div>
              <hr />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Outstanding</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(stats?.outstandingTotal || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overdue</span>
                <span className="font-semibold text-destructive">
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
