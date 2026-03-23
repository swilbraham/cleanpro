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
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Sent", value: "SENT" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Declined", value: "DECLINED" },
  { label: "Converted", value: "CONVERTED" },
];

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  subtotal: number;
  total: number;
  createdAt: string;
  validUntil: string | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
  };
  lineItems: { id: string }[];
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
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  const currentStatus = searchParams.get("status") || "";
  const currentSearch = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(currentSearch);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentSearch) params.set("search", currentSearch);
      if (currentStatus) params.set("status", currentStatus);
      params.set("page", page.toString());

      const res = await fetch(`/api/quotes?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setQuotes(data.quotes);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch quotes:", error);
    } finally {
      setLoading(false);
    }
  }, [currentSearch, currentStatus, page]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

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
    router.push(`/quotes?${params}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchInput });
  };

  const goToPage = (newPage: number) => {
    updateParams({ page: newPage.toString() });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
          <p className="text-muted-foreground">
            Create and manage customer quotes
          </p>
        </div>
        <Link href="/quotes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Quote
          </Button>
        </Link>
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

      <Card>
        <CardHeader>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by quote number or customer..."
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
              <div className="text-muted-foreground">Loading quotes...</div>
            </div>
          ) : quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No quotes found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {currentSearch || currentStatus
                  ? "Try adjusting your filters."
                  : "Get started by creating your first quote."}
              </p>
              {!currentSearch && !currentStatus && (
                <Link href="/quotes/new" className="mt-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Quote
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Valid Until</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow
                      key={quote.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/quotes/${quote.id}`)}
                    >
                      <TableCell className="font-medium">
                        {quote.quoteNumber}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {quote.customer.firstName} {quote.customer.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {quote.customer.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <QuoteStatusBadge status={quote.status} />
                      </TableCell>
                      <TableCell>{quote.lineItems.length}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(quote.total)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(quote.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {quote.validUntil
                          ? formatDate(quote.validUntil)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total} quotes
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

export default function QuotesPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
