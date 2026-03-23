"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/formatters";

const statusColors: Record<string, string> = {
  UNPAID: "warning",
  PARTIAL: "info",
  PAID: "success",
  OVERDUE: "destructive",
  VOID: "secondary",
};

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  amountPaid: number;
  dueDate: string;
  createdAt: string;
  customer: { firstName: string; lastName: string };
}

export function InvoiceMobileCard({ invoice }: { invoice: Invoice }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/invoices/${invoice.id}`)}
      className="cursor-pointer rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50 active:bg-muted"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{invoice.invoiceNumber}</span>
            <Badge
              variant={
                (statusColors[invoice.status] as any) || "secondary"
              }
            >
              {invoice.status}
            </Badge>
          </div>
          <p className="font-medium">
            {invoice.customer.firstName} {invoice.customer.lastName}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">{formatCurrency(invoice.total)}</p>
          {invoice.amountPaid > 0 && invoice.amountPaid < invoice.total && (
            <p className="text-xs text-muted-foreground">
              Paid: {formatCurrency(invoice.amountPaid)}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span>Due: {formatDate(invoice.dueDate)}</span>
        <span>Created: {formatDate(invoice.createdAt)}</span>
      </div>
    </div>
  );
}
