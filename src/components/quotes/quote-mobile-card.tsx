"use client";

import { useRouter } from "next/navigation";
import { QuoteStatusBadge } from "./quote-status-badge";
import { formatDate, formatCurrency } from "@/lib/formatters";

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  total: number;
  createdAt: string;
  validUntil: string | null;
  customer: { firstName: string; lastName: string };
}

export function QuoteMobileCard({ quote }: { quote: Quote }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/quotes/${quote.id}`)}
      className="cursor-pointer rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50 active:bg-muted"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{quote.quoteNumber}</span>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <p className="font-medium">
            {quote.customer.firstName} {quote.customer.lastName}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">{formatCurrency(quote.total)}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span>Created: {formatDate(quote.createdAt)}</span>
        {quote.validUntil && <span>Valid until: {formatDate(quote.validUntil)}</span>}
      </div>
    </div>
  );
}
