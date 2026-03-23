"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ArrowRightLeft,
  Loader2,
  FileDown,
} from "lucide-react";

interface LineItem {
  id: string;
  serviceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  service: {
    id: string;
    name: string;
    unit: string;
  };
}

interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  status: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
    address: string;
    city: string;
    postcode: string;
  };
  lineItems: LineItem[];
  job: {
    id: string;
    jobNumber: string;
    status: string;
  } | null;
}

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchQuote() {
      try {
        const res = await fetch(`/api/quotes/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch quote");
        const data = await res.json();
        setQuote(data);
      } catch (error) {
        console.error("Failed to fetch quote:", error);
        toast("Failed to load quote", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchQuote();
  }, [params.id, toast]);

  const handleConvert = async () => {
    if (!quote) return;
    if (!confirm("Convert this quote to a job? This cannot be undone.")) return;

    setConverting(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/convert`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to convert");
      }
      const job = await res.json();
      toast(`Job ${job.jobNumber} has been created.`);
      router.push(`/quotes/${quote.id}`);
      router.refresh();
      // Re-fetch quote to get updated status
      const updatedRes = await fetch(`/api/quotes/${quote.id}`);
      if (updatedRes.ok) {
        const updatedQuote = await updatedRes.json();
        setQuote(updatedQuote);
      }
    } catch (error: any) {
      toast(error.message || "Failed to convert quote", "error");
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!quote) return;
    if (!confirm("Are you sure you want to delete this quote?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      toast(`Quote ${quote.quoteNumber} has been deleted.`);
      router.push("/quotes");
    } catch (error: any) {
      toast(error.message || "Failed to delete quote", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Quote Not Found</h1>
        <Link href="/quotes">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quotes
          </Button>
        </Link>
      </div>
    );
  }

  const isEditable = quote.status !== "CONVERTED";
  const isConvertible =
    quote.status !== "CONVERTED" && quote.status !== "DECLINED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/quotes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quotes
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">
                {quote.quoteNumber}
              </h1>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <p className="text-muted-foreground truncate">
              Created {formatDate(quote.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/quotes/${quote.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </a>
          {isEditable && (
            <Link href={`/quotes/${quote.id}/edit`}>
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          {isConvertible && (
            <Button onClick={handleConvert} disabled={converting}>
              {converting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRightLeft className="mr-2 h-4 w-4" />
              )}
              Convert to Job
            </Button>
          )}
          {isEditable && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Converted Job Link */}
      {quote.job && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  This quote has been converted to a job
                </p>
                <p className="font-medium">
                  Job {quote.job.jobNumber} ({quote.job.status})
                </p>
              </div>
              <Link href={`/jobs/${quote.job.id}`}>
                <Button variant="outline" size="sm">
                  View Job
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-medium">
                {quote.customer.firstName} {quote.customer.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {quote.customer.phone}
              </p>
              {quote.customer.email && (
                <p className="text-sm text-muted-foreground">
                  {quote.customer.email}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {quote.customer.address}
              </p>
              <p className="text-sm text-muted-foreground">
                {quote.customer.city}, {quote.customer.postcode}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quote Details */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <QuoteStatusBadge status={quote.status} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valid Until</span>
                <span>
                  {quote.validUntil
                    ? formatDate(quote.validUntil)
                    : "Not set"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(quote.updatedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(quote.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  VAT ({quote.taxRate}%)
                </span>
                <span>{formatCurrency(quote.taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(quote.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead className="hidden sm:table-cell">Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.service.name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{item.description}</TableCell>
                  <TableCell className="text-right">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {quote.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{quote.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
