"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users } from "lucide-react";

const reports = [
  {
    title: "Revenue Report",
    description:
      "Track income over time with daily breakdowns. See total revenue for any date range.",
    href: "/reports/revenue",
    icon: TrendingUp,
  },
  {
    title: "Jobs Report",
    description:
      "View job counts by status. Understand workload distribution across scheduled, completed, and cancelled jobs.",
    href: "/reports/jobs",
    icon: BarChart3,
  },
  {
    title: "Team Performance",
    description:
      "See per-team-member stats including total jobs, completed jobs, and revenue generated.",
    href: "/reports/team",
    icon: Users,
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Analyse your business performance with detailed reports.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card className="h-full transition-colors hover:border-primary/50 hover:shadow-md cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <report.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {report.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
