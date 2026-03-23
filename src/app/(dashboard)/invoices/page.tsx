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
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { InvoiceMobileCard } from "@/components/invoices/invoice-mobile-card";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  XCircle,
} from "lucide-react";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Unpaid", value: "UNPAID" },
  { label: "Partial", value: "PARTIAL" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
];

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  total: number;
  amountPaid: number;
  dueDate: string;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
  };
  job: {
    id: string;
    jobNumber: string;
  };
  payments: { id: string; amount: number; status: string }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function PageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const currentStatus = searchParams.get("status") || "";
  const currentSearch = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(currentSearch);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentSearch) params.set("search", currentSearch);
      if (currentStatus) params.set("status", currentStatus);
      params.set("page", page.toString());

      const res = await fetch(`/api/invoices?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setInvoices(data.invoices);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  }, [currentSearch, currentStatus, page]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Clear selection when invoices change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [invoices]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    if (updates.status !== undefined || updates.search !== undefined) {
      params.set("page", "1");
    }
    router.push(`/invoices?${params}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchInput });
  };

  const goToPage = (newPage: number) => {
    updateParams({ page: newPage.toString() });
  };

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
    if (selectedIds.size === invoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invoices.map((i) => i.id)));
    }
  };

  const handleBulkAction = async (action: string) => {
    const count = selectedIds.size;
    const actionLabel = action === "delete" ? "delete" : "void";

    if (
      !confirm(
        `Are you sure you want to ${actionLabel} ${count} invoice(s)? This cannot be undone.`
      )
    ) {
      return;
    }

    setBulkLoading(true);
    try {
      const res = await fetch("/api/invoices/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: Array.from(selectedIds) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk action failed");

      toast(data.message);
      setSelectedIds(new Set());
      fetchInvoices();
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
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage invoices and track payments
          </p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={currentStatus === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => updateParams({ status: filter.value })}
          >
            {filter.label}
          </Button>
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
            onClick={() => handleBulkAction("void")}
            disabled={bulkLoading}
          >
            <XCircle className="mr-1 h-3.5 w-3.5 text-yellow-600" />
            Void
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
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by invoice number or customer..."
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
              <div className="text-muted-foreground">Loading invoices...</div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No invoices found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {currentSearch || currentStatus
                  ? "Try adjusting your filters."
                  : "Invoices are created when jobs are completed."}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="space-y-3 lg:hidden">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(invoice.id)}
                      onChange={() => toggleSelect(invoice.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-4 h-4 w-4 rounded border-border text-primary focus:ring-primary shrink-0"
                    />
                    <div className="flex-1">
                      <InvoiceMobileCard invoice={invoice} />
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
                          invoices.length > 0 &&
                          selectedIds.size === invoices.length
                        }
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                    </TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className={`cursor-pointer ${selectedIds.has(invoice.id) ? "bg-primary/5" : ""}`}
                    >
                      <TableCell
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(invoice.id)}
                          onChange={() => toggleSelect(invoice.id)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                      </TableCell>
                      <TableCell
                        className="font-medium"
                        onClick={() =>
                          router.push(`/invoices/${invoice.id}`)
                        }
                      >
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell
                        onClick={() =>
                          router.push(`/invoices/${invoice.id}`)
                        }
                      >
                        <div className="text-sm font-medium">
                          {invoice.customer.firstName}{" "}
                          {invoice.customer.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.customer.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/jobs/${invoice.job.id}`}
                          className="text-sm text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {invoice.job.jobNumber}
                        </Link>
                      </TableCell>
                      <TableCell
                        onClick={() =>
                          router.push(`/invoices/${invoice.id}`)
                        }
                      >
                        <PaymentStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell
                        className="text-right font-medium"
                        onClick={() =>
                          router.push(`/invoices/${invoice.id}`)
                        }
                      >
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={() =>
                          router.push(`/invoices/${invoice.id}`)
                        }
                      >
                        {formatCurrency(invoice.amountPaid)}
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground"
                        onClick={() =>
                          router.push(`/invoices/${invoice.id}`)
                        }
                      >
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground"
                        onClick={() =>
                          router.push(`/invoices/${invoice.id}`)
                        }
                      >
                        {formatDate(invoice.createdAt)}
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
                    of {pagination.total} invoices
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

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
