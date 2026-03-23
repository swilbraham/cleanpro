"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/customers/customer-form";
import { useToast } from "@/components/ui/toast";
import { ArrowLeft } from "lucide-react";
import type { CustomerFormData } from "@/lib/validators";

export default function NewCustomerPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create customer");
      }

      const customer = await res.json();
      toast("Customer created successfully");
      router.push(`/customers/${customer.id}`);
    } catch (error: any) {
      toast(error.message || "Failed to create customer", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Customer</h1>
          <p className="text-muted-foreground">
            Add a new customer to your database
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <CustomerForm onSubmit={handleSubmit} submitLabel="Create Customer" />
      </div>
    </div>
  );
}
