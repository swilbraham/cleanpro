"use client";

import { QuoteForm } from "@/components/quotes/quote-form";

export default function NewQuotePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Quote</h1>
        <p className="text-muted-foreground">
          Create a new quote for a customer
        </p>
      </div>
      <QuoteForm />
    </div>
  );
}
