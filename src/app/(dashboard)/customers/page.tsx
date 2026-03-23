"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { CustomerMobileCard } from "@/components/customers/customer-mobile-card";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/formatters";
import { Plus, Search, ChevronLeft, ChevronRight, Users, Trash2 } from "lucide-react";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  tags: string[];
  createdAt: string;
  properties: { id: string }[];
  jobs: { id: string; status: string }[];
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const page = parseInt(searchParams.get("page") || "1", 10);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", page.toString());

      const res = await fetch(`/api/customers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Clear selection when customers change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [customers]);

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
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map((c) => c.id)));
    }
  };

  const handleBulkAction = async (action: string) => {
    const count = selectedIds.size;
    const actionLabel = "delete";

    if (
      !confirm(
        `Are you sure you want to ${actionLabel} ${count} customer(s)? This cannot be undone.`
      )
    ) {
      return;
    }

    setBulkLoading(true);
    try {
      const res = await fetch("/api/customers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: Array.from(selectedIds) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk action failed");

      toast(data.message);
      setSelectedIds(new Set());
      fetchCustomers();
    } catch (error: any) {
      toast(error.message || "Bulk action failed", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const hasSelection = selectedIds.size > 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput) params.set("search", searchInput);
    params.set("page", "1");
    setSearch(searchInput);
    router.push(`/customers?${params}`);
  };

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", newPage.toString());
    router.push(`/customers?${params}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer database
          </p>
        </div>
        <Link href="/customers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Customer
          </Button>
        </Link>
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
                placeholder="Search by name, email, phone, or postcode..."
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
              <div className="text-muted-foreground">Loading customers...</div>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No customers found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {search
                  ? "Try a different search term."
                  : "Get started by adding your first customer."}
              </p>
              {!search && (
                <Link href="/customers/new" className="mt-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customer
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {customers.map((customer) => (
                  <div key={customer.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(customer.id)}
                      onChange={() => toggleSelect(customer.id)}
                      className="mt-4 h-4 w-4 rounded border-border text-primary focus:ring-primary shrink-0"
                    />
                    <div className="flex-1">
                      <CustomerMobileCard customer={customer} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={
                          customers.length > 0 && selectedIds.size === customers.length
                        }
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className={`cursor-pointer ${selectedIds.has(customer.id) ? "bg-primary/5" : ""}`}
                    >
                      <TableCell
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(customer.id)}
                          onChange={() => toggleSelect(customer.id)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                      </TableCell>
                      <TableCell
                        className="font-medium"
                        onClick={() => router.push(`/customers/${customer.id}`)}
                      >
                        {customer.firstName} {customer.lastName}
                      </TableCell>
                      <TableCell
                        onClick={() => router.push(`/customers/${customer.id}`)}
                      >
                        <div className="text-sm">{customer.phone}</div>
                        {customer.email && (
                          <div className="text-sm text-muted-foreground">
                            {customer.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell
                        onClick={() => router.push(`/customers/${customer.id}`)}
                      >
                        <div className="text-sm">{customer.city}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.postcode}
                        </div>
                      </TableCell>
                      <TableCell
                        onClick={() => router.push(`/customers/${customer.id}`)}
                      >
                        {customer.properties.length}
                      </TableCell>
                      <TableCell
                        onClick={() => router.push(`/customers/${customer.id}`)}
                      >
                        {customer.jobs.length}
                      </TableCell>
                      <TableCell
                        onClick={() => router.push(`/customers/${customer.id}`)}
                      >
                        <div className="flex flex-wrap gap-1">
                          {customer.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                          {customer.tags.length > 3 && (
                            <Badge variant="secondary">
                              +{customer.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground"
                        onClick={() => router.push(`/customers/${customer.id}`)}
                      >
                        {formatDate(customer.createdAt)}
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
                    of {pagination.total} customers
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

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
