"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuoteForm } from "@/components/quotes/quote-form";
import { ArrowLeft, Loader2 } from "lucide-react";

interface QuoteData {
  id: string;
  quoteNumber: string;
  customerId: string;
  status: string;
  notes: string | null;
  validUntil: string | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
  };
  lineItems: {
    serviceId: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export default function EditQuotePage() {
  const params = useParams();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuote() {
      try {
        const res = await fetch(`/api/quotes/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch quote");
        const data = await res.json();

        if (data.status === "CONVERTED") {
          setError("Cannot edit a converted quote.");
          return;
        }

        setQuote(data);
      } catch (err) {
        console.error("Failed to fetch quote:", err);
        setError("Failed to load quote.");
      } finally {
        setLoading(false);
      }
    }
    fetchQuote();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {error || "Quote Not Found"}
        </h1>
        <Link href="/quotes">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quotes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/quotes/${quote.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit {quote.quoteNumber}
          </h1>
          <p className="text-muted-foreground">Update quote details</p>
        </div>
      </div>
      <QuoteForm initialData={quote} />
    </div>
  );
}
