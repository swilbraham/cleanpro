"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { JobMobileCard } from "@/components/jobs/job-mobile-card";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatTime, formatCurrency } from "@/lib/formatters";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Calendar,
  Trash2,
  XCircle,
  CheckCircle,
  RotateCcw,
} from "lucide-react";

interface Job {
  id: string;
  jobNumber: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string | null;
  duration: number;
  notes: string | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  property: {
    id: string;
    address: string;
    city: string;
    postcode: string;
  } | null;
  assignedTo: { id: string; name: string; color: string | null } | null;
  lineItems: { id: string; description: string; total: number }[];
  invoice: { id: string; invoiceNumber: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Invoiced", value: "INVOICED" },
  { label: "Cancelled", value: "CANCELLED" },
];

function PageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const activeStatus = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";
  const dateFrom = searchParams.get("from") || "";
  const dateTo = searchParams.get("to") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(search);
  const [dateFromInput, setDateFromInput] = useState(dateFrom);
  const [dateToInput, setDateToInput] = useState(dateTo);

  const buildParams = useCallback(
    (overrides: Record<string, string> = {}) => {
      const params = new URLSearchParams();
      const values = {
        status: activeStatus,
        search,
        from: dateFrom,
        to: dateTo,
        page: page.toString(),
        ...overrides,
      };
      Object.entries(values).forEach(([key, val]) => {
        if (val) params.set(key, val);
      });
      return params;
    },
    [activeStatus, search, dateFrom, dateTo, page]
  );

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();
      const res = await fetch(`/api/jobs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Clear selection when jobs change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [jobs]);

  const handleStatusTab = (status: string) => {
    const params = buildParams({ status, page: "1" });
    router.push(`/jobs?${params}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = buildParams({ search: searchInput, page: "1" });
    router.push(`/jobs?${params}`);
  };

  const handleDateFilter = () => {
    const params = buildParams({
      from: dateFromInput,
      to: dateToInput,
      page: "1",
    });
    router.push(`/jobs?${params}`);
  };

  const goToPage = (newPage: number) => {
    const params = buildParams({ page: newPage.toString() });
    router.push(`/jobs?${params}`);
  };

  const getJobTotal = (job: Job) =>
    job.lineItems.reduce((sum, item) => sum + item.total, 0);

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === jobs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(jobs.map((j) => j.id)));
    }
  };

  const handleBulkAction = async (action: string) => {
    const count = selectedIds.size;
    const actionLabel =
      action === "delete"
        ? "delete"
        : action === "cancel"
          ? "cancel"
          : action === "complete"
            ? "complete"
            : "reschedule";

    if (
      !confirm(
        `Are you sure you want to ${actionLabel} ${count} job(s)? This cannot be undone.`
      )
    ) {
      return;
    }

    setBulkLoading(true);
    try {
      const res = await fetch("/api/jobs/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: Array.from(selectedIds) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk action failed");

      toast(data.message);
      setSelectedIds(new Set());
      fetchJobs();
    } catch (error: any) {
      toast(error.message || "Bulk action failed", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const hasSelection = selectedIds.size > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            Manage and track cleaning jobs
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/calendar">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
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

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-1 border-b">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleStatusTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeStatus === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {hasSelection && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction("complete")}
            disabled={bulkLoading}
          >
            <CheckCircle className="mr-1 h-3.5 w-3.5 text-green-600" />
            Complete
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction("cancel")}
            disabled={bulkLoading}
          >
            <XCircle className="mr-1 h-3.5 w-3.5 text-yellow-600" />
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction("schedule")}
            disabled={bulkLoading}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5 text-blue-600" />
            Reschedule
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction("delete")}
            disabled={bulkLoading}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Delete
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by job number, customer, or address..."
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateFromInput}
                onChange={(e) => setDateFromInput(e.target.value)}
                className="w-[150px]"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="date"
                value={dateToInput}
                onChange={(e) => setDateToInput(e.target.value)}
                className="w-[150px]"
              />
              <Button variant="outline" size="sm" onClick={handleDateFilter}>
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading jobs...</div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No jobs found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {search || activeStatus
                  ? "Try adjusting your filters."
                  : "Get started by creating your first job."}
              </p>
              {!search && !activeStatus && (
                <Link href="/jobs/new" className="mt-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Job
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="space-y-3 lg:hidden">
                {jobs.map((job) => (
                  <div key={job.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(job.id)}
                      onChange={() => toggleSelect(job.id)}
                      className="mt-4 h-4 w-4 rounded border-border text-primary focus:ring-primary shrink-0"
                    />
                    <div className="flex-1">
                      <JobMobileCard job={job} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={
                            jobs.length > 0 && selectedIds.size === jobs.length
                          }
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                      </TableHead>
                      <TableHead>Job #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow
                        key={job.id}
                        className={`cursor-pointer ${selectedIds.has(job.id) ? "bg-primary/5" : ""}`}
                      >
                        <TableCell
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(job.id)}
                            onChange={() => toggleSelect(job.id)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                        </TableCell>
                        <TableCell
                          className="font-medium"
                          onClick={() => router.push(`/jobs/${job.id}`)}
                        >
                          {job.jobNumber}
                        </TableCell>
                        <TableCell
                          onClick={() => router.push(`/jobs/${job.id}`)}
                        >
                          <JobStatusBadge status={job.status} />
                        </TableCell>
                        <TableCell
                          onClick={() => router.push(`/jobs/${job.id}`)}
                        >
                          {job.customer.firstName} {job.customer.lastName}
                        </TableCell>
                        <TableCell
                          onClick={() => router.push(`/jobs/${job.id}`)}
                        >
                          {job.property?.address || "No property"}
                        </TableCell>
                        <TableCell
                          onClick={() => router.push(`/jobs/${job.id}`)}
                        >
                          {formatDate(job.scheduledDate)}
                        </TableCell>
                        <TableCell
                          onClick={() => router.push(`/jobs/${job.id}`)}
                        >
                          {job.scheduledTime
                            ? formatTime(job.scheduledTime)
                            : "-"}
                        </TableCell>
                        <TableCell
                          onClick={() => router.push(`/jobs/${job.id}`)}
                        >
                          {job.assignedTo ? (
                            <span className="flex items-center gap-2">
                              {job.assignedTo.color && (
                                <span
                                  className="inline-block h-3 w-3 rounded-full"
                                  style={{
                                    backgroundColor: job.assignedTo.color,
                                  }}
                                />
                              )}
                              {job.assignedTo.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={() => router.push(`/jobs/${job.id}`)}
                        >
                          {formatCurrency(getJobTotal(job))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total} jobs
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => goToPage(pagination.page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => goToPage(pagination.page + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
