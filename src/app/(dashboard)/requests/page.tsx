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
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react";

interface RequestItem {
  id: string;
  source: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  address: string | null;
  city: string | null;
  postcode: string | null;
  description: string;
  status: string;
  priority: string;
  notes: string | null;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  assignedTo: { id: string; name: string; color: string | null } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "New", value: "NEW" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Quoted", value: "QUOTED" },
  { label: "Won", value: "WON" },
  { label: "Lost", value: "LOST" },
];

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  HIGH: { label: "High", className: "bg-red-100 text-red-800" },
  MEDIUM: { label: "Medium", className: "bg-yellow-100 text-yellow-800" },
  LOW: { label: "Low", className: "bg-gray-100 text-gray-800" },
};

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  PHONE: "Phone",
  EMAIL: "Email",
  REFERRAL: "Referral",
  OTHER: "Other",
};

function PageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  const activeStatus = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(search);

  const buildParams = useCallback(
    (overrides: Record<string, string> = {}) => {
      const params = new URLSearchParams();
      const values = {
        status: activeStatus,
        search,
        page: page.toString(),
        ...overrides,
      };
      Object.entries(values).forEach(([key, val]) => {
        if (val) params.set(key, val);
      });
      return params;
    },
    [activeStatus, search, page]
  );

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();
      const res = await fetch(`/api/requests?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRequests(data.requests);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusTab = (status: string) => {
    const params = buildParams({ status, page: "1" });
    router.push(`/requests?${params}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = buildParams({ search: searchInput, page: "1" });
    router.push(`/requests?${params}`);
  };

  const goToPage = (newPage: number) => {
    const params = buildParams({ page: newPage.toString() });
    router.push(`/requests?${params}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground">
            Manage incoming leads and requests
          </p>
        </div>
        <Link href="/requests/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </Link>
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

      <Card>
        <CardHeader>
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, email, phone, or description..."
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading requests...</div>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No requests found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {search || activeStatus
                  ? "Try adjusting your filters."
                  : "Get started by creating your first request."}
              </p>
              {!search && !activeStatus && (
                <Link href="/requests/new" className="mt-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Request
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="space-y-3 lg:hidden">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => router.push(`/requests/${req.id}`)}
                    className="cursor-pointer rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50 active:bg-muted"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <RequestStatusBadge status={req.status} />
                          <Badge
                            variant="secondary"
                            className={
                              PRIORITY_CONFIG[req.priority]?.className || ""
                            }
                          >
                            {PRIORITY_CONFIG[req.priority]?.label ||
                              req.priority}
                          </Badge>
                        </div>
                        <p className="font-medium">
                          {req.firstName} {req.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {req.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatDate(req.createdAt)}</span>
                      <span>{SOURCE_LABELS[req.source] || req.source}</span>
                      {req.phone && <span>{req.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req) => (
                      <TableRow
                        key={req.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/requests/${req.id}`)}
                      >
                        <TableCell>
                          <RequestStatusBadge status={req.status} />
                        </TableCell>
                        <TableCell className="font-medium">
                          {req.firstName} {req.lastName}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{req.phone}</p>
                            {req.email && (
                              <p className="text-muted-foreground">
                                {req.email}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {SOURCE_LABELS[req.source] || req.source}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              PRIORITY_CONFIG[req.priority]?.className || ""
                            }
                          >
                            {PRIORITY_CONFIG[req.priority]?.label ||
                              req.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="truncate text-sm">{req.description}</p>
                        </TableCell>
                        <TableCell>{formatDate(req.createdAt)}</TableCell>
                        <TableCell>
                          {req.assignedTo ? (
                            <span className="flex items-center gap-2">
                              {req.assignedTo.color && (
                                <span
                                  className="inline-block h-3 w-3 rounded-full"
                                  style={{
                                    backgroundColor: req.assignedTo.color,
                                  }}
                                />
                              )}
                              {req.assignedTo.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Unassigned
                            </span>
                          )}
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
                    of {pagination.total} requests
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

export default function RequestsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
