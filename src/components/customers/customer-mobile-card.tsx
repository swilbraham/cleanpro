"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  city: string;
  postcode: string;
  tags: string[];
  _count?: { properties: number; jobs: number };
}

export function CustomerMobileCard({ customer }: { customer: Customer }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/customers/${customer.id}`)}
      className="cursor-pointer rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50 active:bg-muted"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="font-semibold">
            {customer.firstName} {customer.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{customer.phone}</p>
          {customer.email && (
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          )}
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>{customer.city}</p>
          <p>{customer.postcode}</p>
        </div>
      </div>
      {(customer.tags.length > 0 || customer._count) && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {customer.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {customer._count && (
            <span className="text-xs text-muted-foreground">
              {customer._count.jobs} jobs · {customer._count.properties} properties
            </span>
          )}
        </div>
      )}
    </div>
  );
}
