"use client";

import { useRouter } from "next/navigation";
import { JobStatusBadge } from "./job-status-badge";
import { formatDate, formatTime, formatCurrency } from "@/lib/formatters";

interface Job {
  id: string;
  jobNumber: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string | null;
  customer: { firstName: string; lastName: string };
  property: { address: string } | null;
  assignedTo: { name: string; color: string | null } | null;
  lineItems: { total: number }[];
}

export function JobMobileCard({ job }: { job: Job }) {
  const router = useRouter();
  const total = job.lineItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div
      onClick={() => router.push(`/jobs/${job.id}`)}
      className="cursor-pointer rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50 active:bg-muted"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm truncate">{job.jobNumber}</span>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="font-medium truncate">
            {job.customer.firstName} {job.customer.lastName}
          </p>
          {job.property && (
            <p className="text-sm text-muted-foreground truncate">{job.property.address}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-semibold">{formatCurrency(total)}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span>{formatDate(job.scheduledDate)}</span>
        {job.scheduledTime && <span>{formatTime(job.scheduledTime)}</span>}
        {job.assignedTo && (
          <span className="flex items-center gap-1">
            {job.assignedTo.color && (
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: job.assignedTo.color }}
              />
            )}
            {job.assignedTo.name}
          </span>
        )}
      </div>
    </div>
  );
}
