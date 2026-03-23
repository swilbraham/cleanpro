"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { JobForm } from "@/components/jobs/job-form";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditJobPage() {
  const params = useParams();
  const id = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs/${id}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch job");
        }
        const data = await res.json();
        setJob(data);
      } catch (err: any) {
        setError(err.message || "Failed to load job");
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchJob();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-4">
        <Link
          href={`/jobs/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to job
        </Link>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {error || "Job not found"}
          </p>
        </div>
      </div>
    );
  }

  // Map the API response to the initialData format expected by JobForm
  const initialData = {
    id: job.id,
    customerId: job.customerId,
    customer: {
      id: job.customer.id,
      firstName: job.customer.firstName,
      lastName: job.customer.lastName,
      email: job.customer.email,
      phone: job.customer.phone,
    },
    propertyId: job.propertyId || null,
    assignedToId: job.assignedToId || null,
    scheduledDate: job.scheduledDate,
    scheduledTime: job.scheduledTime || null,
    duration: job.duration || 60,
    notes: job.notes || null,
    lineItems: (job.lineItems || []).map((item: any) => ({
      serviceId: item.serviceId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/jobs/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to job
        </Link>
        <h1 className="text-2xl font-bold">
          Edit Job - {job.jobNumber}
        </h1>
      </div>

      <JobForm initialData={initialData} />
    </div>
  );
}
