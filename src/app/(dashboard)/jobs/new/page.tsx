"use client";

import { JobForm } from "@/components/jobs/job-form";

export default function NewJobPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Job</h1>
        <p className="text-muted-foreground">
          Schedule a new cleaning job
        </p>
      </div>
      <JobForm />
    </div>
  );
}
