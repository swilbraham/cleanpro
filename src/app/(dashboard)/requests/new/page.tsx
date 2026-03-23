"use client";

import { RequestForm } from "@/components/requests/request-form";

export default function NewRequestPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Request</h1>
        <p className="text-muted-foreground">
          Log a new incoming lead or request
        </p>
      </div>
      <RequestForm />
    </div>
  );
}
