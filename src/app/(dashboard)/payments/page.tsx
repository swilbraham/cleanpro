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
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from "lucide-react";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: "Card",
  KLARNA: "Klarna",
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
};

interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  status: string;
  stripePaymentId: string | null;
  createdAt: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    customer: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  const currentSearch = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(currentSearch);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentSearch) params.set("search", currentSearch);
      params.set("page", page.toString());

      const res = await fetch(`/api/payments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPayments(data.payments);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  }, [currentSearch, page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    if (updates.search !== undefined) {
      params.set("page", "1");
    }
    router.push(`/payments?${params}`);
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          View payment history across all invoices
        </p>
      </div>

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
              <div className="text-muted-foreground">Loading payments...</div>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {currentSearch
                  ? "Try adjusting your search."
                  : "Payments will appear here once invoices are paid."}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {formatDateTime(payment.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/invoices/${payment.invoice.id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {payment.invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {payment.invoice.customer.firstName}{" "}
                        {payment.invoice.customer.lastName}
                      </TableCell>
                      <TableCell>
                        {PAYMENT_METHOD_LABELS[payment.method] ||
                          payment.method}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {payment.stripePaymentId || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payment.amount)}
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
                    of {pagination.total} payments
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

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
