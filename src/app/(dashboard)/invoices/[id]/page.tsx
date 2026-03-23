"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { CheckoutButton } from "@/components/payments/checkout-button";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import {
  ArrowLeft,
  Download,
  Loader2,
  Banknote,
  CreditCard,
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

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  stripePaymentId: string | null;
  stripeCheckoutId: string | null;
  createdAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  jobId: string;
  customerId: string;
  status: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  dueDate: string;
  paidAt: string | null;
  notes: string | null;
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
  job: {
    id: string;
    jobNumber: string;
    lineItems: LineItem[];
  };
  payments: Payment[];
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: "Card",
  KLARNA: "Klarna",
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
};

function PageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Manual payment form state
  const [showManualPayment, setShowManualPayment] = useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [manualMethod, setManualMethod] = useState("CASH");
  const [submittingManual, setSubmittingManual] = useState(false);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      toast("Payment completed successfully!", "success");
    } else if (paymentStatus === "cancelled") {
      toast("Payment was cancelled", "info");
    }
  }, [searchParams, toast]);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/invoices/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch invoice");
        const data = await res.json();
        setInvoice(data);
      } catch (error) {
        console.error("Failed to fetch invoice:", error);
        toast("Failed to load invoice", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [params.id, toast]);

  const handleDownloadPDF = () => {
    if (!invoice) return;
    window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
  };

  const handleRecordManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    const amount = parseFloat(manualAmount);
    if (isNaN(amount) || amount <= 0) {
      toast("Please enter a valid amount", "error");
      return;
    }

    const amountDue = invoice.total - invoice.amountPaid;
    if (amount > amountDue) {
      toast("Amount cannot exceed the amount due", "error");
      return;
    }

    setSubmittingManual(true);
    try {
      const newAmountPaid = invoice.amountPaid + amount;
      const isPaid = newAmountPaid >= invoice.total;

      // Create payment record and update invoice atomically via API
      const paymentRes = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: isPaid ? "PAID" : "PARTIAL",
        }),
      });

      if (!paymentRes.ok) throw new Error("Failed to record payment");

      // Also create the payment record directly
      const createPaymentRes = await fetch(`/api/payments/record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount,
          method: manualMethod,
        }),
      });

      if (!createPaymentRes.ok) throw new Error("Failed to record payment");

      toast("Payment recorded successfully", "success");
      setShowManualPayment(false);
      setManualAmount("");
      setManualMethod("CASH");

      // Re-fetch invoice
      const updatedRes = await fetch(`/api/invoices/${invoice.id}`);
      if (updatedRes.ok) {
        const updatedInvoice = await updatedRes.json();
        setInvoice(updatedInvoice);
      }
    } catch (error: any) {
      toast(error.message || "Failed to record payment", "error");
    } finally {
      setSubmittingManual(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Invoice Not Found
        </h1>
        <Link href="/invoices">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  const amountDue = invoice.total - invoice.amountPaid;
  const canPay = invoice.status !== "PAID" && invoice.status !== "VOID";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Invoices
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">
                {invoice.invoiceNumber}
              </h1>
              <PaymentStatusBadge status={invoice.status} />
            </div>
            <p className="text-muted-foreground truncate">
              Created {formatDate(invoice.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          {canPay && (
            <>
              <CheckoutButton invoiceId={invoice.id} />
              <Button
                variant="outline"
                onClick={() => setShowManualPayment(!showManualPayment)}
              >
                <Banknote className="mr-2 h-4 w-4" />
                Record Manual Payment
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Manual Payment Form */}
      {showManualPayment && (
        <Card>
          <CardHeader>
            <CardTitle>Record Manual Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleRecordManualPayment}
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={amountDue}
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder={`Max ${formatCurrency(amountDue)}`}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select
                  id="method"
                  className="w-full sm:w-[180px]"
                  value={manualMethod}
                  onChange={(e) => setManualMethod(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </Select>
              </div>
              <Button type="submit" disabled={submittingManual}>
                {submittingManual && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Record Payment
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowManualPayment(false)}
              >
                Cancel
              </Button>
            </form>
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
                {invoice.customer.firstName} {invoice.customer.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.customer.phone}
              </p>
              {invoice.customer.email && (
                <p className="text-sm text-muted-foreground">
                  {invoice.customer.email}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {invoice.customer.address}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.customer.city}, {invoice.customer.postcode}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <PaymentStatusBadge status={invoice.status} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Job</span>
                <Link
                  href={`/jobs/${invoice.job.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {invoice.job.jobNumber}
                </Link>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Due Date</span>
                <span>{formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.paidAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid At</span>
                  <span>{formatDate(invoice.paidAt)}</span>
                </div>
              )}
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
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  VAT ({invoice.taxRate}%)
                </span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="text-green-600">
                  {formatCurrency(invoice.amountPaid)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Amount Due</span>
                <span
                  className={amountDue > 0 ? "text-red-600" : "text-green-600"}
                >
                  {formatCurrency(amountDue)}
                </span>
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
              {invoice.job.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.service.name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
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

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No payments recorded yet
            </p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {formatDateTime(payment.createdAt)}
                    </TableCell>
                    <TableCell>
                      {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <PaymentStatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                      {payment.stripePaymentId || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function InvoiceDetailPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
