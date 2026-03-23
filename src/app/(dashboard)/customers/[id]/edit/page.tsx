"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/customers/customer-form";
import { useToast } from "@/components/ui/toast";
import { ArrowLeft } from "lucide-react";
import type { CustomerFormData } from "@/lib/validators";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [customer, setCustomer] = useState<CustomerFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/customers/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setCustomer({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || "",
          phone: data.phone,
          address: data.address,
          city: data.city,
          postcode: data.postcode,
          tags: data.tags || [],
        });
      } catch {
        toast("Customer not found", "error");
        router.push("/customers");
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [id, router, toast]);

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update customer");
      }

      toast("Customer updated successfully");
      router.push(`/customers/${id}`);
    } catch (error: any) {
      toast(error.message || "Failed to update customer", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/customers/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Customer</h1>
          <p className="text-muted-foreground">
            Update customer information
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <CustomerForm
          defaultValues={customer}
          onSubmit={handleSubmit}
          submitLabel="Update Customer"
        />
      </div>
    </div>
  );
}
