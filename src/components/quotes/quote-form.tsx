"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quoteSchema, type QuoteFormData } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/formatters";
import { Plus, Trash2, Loader2, Search } from "lucide-react";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  unit: string;
  category: string;
}

interface QuoteFormProps {
  initialData?: {
    id: string;
    customerId: string;
    customer: Customer;
    notes: string | null;
    validUntil: string | null;
    lineItems: {
      serviceId: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }[];
  };
}

export function QuoteForm({ initialData }: QuoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  // Customer search state
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    initialData?.customer || null
  );
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      customerId: initialData?.customerId || "",
      notes: initialData?.notes || "",
      validUntil: initialData?.validUntil
        ? new Date(initialData.validUntil).toISOString().split("T")[0]
        : "",
      lineItems: initialData?.lineItems || [
        { serviceId: "", description: "", quantity: 1, unitPrice: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const watchLineItems = watch("lineItems");

  // Fetch services on mount
  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch("/api/services?active=true");
        if (!res.ok) throw new Error("Failed to fetch services");
        const data = await res.json();
        setServices(data.services);
      } catch (error) {
        console.error("Failed to load services:", error);
      }
    }
    loadServices();
  }, []);

  // Customer search
  const searchCustomers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCustomerResults([]);
      return;
    }
    setSearchingCustomers(true);
    try {
      const res = await fetch(
        `/api/customers?search=${encodeURIComponent(query)}&limit=10`
      );
      if (!res.ok) throw new Error("Failed to search customers");
      const data = await res.json();
      setCustomerResults(data.customers);
    } catch (error) {
      console.error("Failed to search customers:", error);
    } finally {
      setSearchingCustomers(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch) {
        searchCustomers(customerSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch, searchCustomers]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(e.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setValue("customerId", customer.id);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      setValue(`lineItems.${index}.serviceId`, serviceId);
      setValue(`lineItems.${index}.description`, service.description || service.name);
      setValue(`lineItems.${index}.unitPrice`, service.unitPrice);
    }
  };

  // Calculate totals
  const subtotal = (watchLineItems || []).reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);
  const taxAmount = subtotal * 0.2;
  const total = subtotal + taxAmount;

  const onSubmit = async (data: QuoteFormData) => {
    setSubmitting(true);
    try {
      const url = initialData
        ? `/api/quotes/${initialData.id}`
        : "/api/quotes";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save quote");
      }

      const quote = await res.json();
      toast(`Quote ${quote.quoteNumber} has been ${initialData ? "updated" : "created"}.`);
      router.push(`/quotes/${quote.id}`);
    } catch (error: any) {
      toast(error.message || "Failed to save quote", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <input type="hidden" {...register("customerId")} />
          {selectedCustomer ? (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedCustomer.phone}
                  {selectedCustomer.email && ` | ${selectedCustomer.email}`}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCustomer(null);
                  setValue("customerId", "");
                }}
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="relative" ref={customerDropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search customers by name, email, or phone..."
                  className="pl-9"
                />
                {searchingCustomers && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
              {showCustomerDropdown && customerResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                  {customerResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="flex w-full flex-col items-start px-4 py-2 hover:bg-accent text-left"
                      onClick={() => selectCustomer(customer)}
                    >
                      <span className="font-medium">
                        {customer.firstName} {customer.lastName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {customer.phone}
                        {customer.email && ` | ${customer.email}`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {showCustomerDropdown &&
                customerSearch.length >= 2 &&
                !searchingCustomers &&
                customerResults.length === 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover px-4 py-3 shadow-lg">
                    <p className="text-sm text-muted-foreground">
                      No customers found
                    </p>
                  </div>
                )}
            </div>
          )}
          {errors.customerId && (
            <p className="mt-1 text-sm text-destructive">
              {errors.customerId.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  serviceId: "",
                  description: "",
                  quantity: 1,
                  unitPrice: 0,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => {
            const lineTotal =
              (watchLineItems?.[index]?.quantity || 0) *
              (watchLineItems?.[index]?.unitPrice || 0);
            return (
              <div
                key={field.id}
                className="flex flex-col gap-3 rounded-md border p-3 md:grid md:grid-cols-12 md:items-end md:p-4"
              >
                <div className="md:col-span-3">
                  <Label>Service</Label>
                  <Select
                    value={watchLineItems?.[index]?.serviceId || ""}
                    onChange={(e) => handleServiceChange(index, e.target.value)}
                  >
                    <option value="">Select service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({formatCurrency(service.unitPrice)}/{service.unit})
                      </option>
                    ))}
                  </Select>
                  {errors.lineItems?.[index]?.serviceId && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.lineItems[index]?.serviceId?.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-3">
                  <Label>Description</Label>
                  <Input
                    {...register(`lineItems.${index}.description`)}
                    placeholder="Description"
                  />
                  {errors.lineItems?.[index]?.description && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.lineItems[index]?.description?.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    {...register(`lineItems.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.lineItems?.[index]?.quantity && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.lineItems[index]?.quantity?.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    {...register(`lineItems.${index}.unitPrice`, {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.lineItems?.[index]?.unitPrice && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.lineItems[index]?.unitPrice?.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between md:col-span-2 md:contents">
                  <div className="md:col-span-1 md:text-right">
                    <Label>Total</Label>
                    <p className="py-2 font-medium">
                      {formatCurrency(lineTotal)}
                    </p>
                  </div>

                  <div className="md:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {errors.lineItems?.root && (
            <p className="text-sm text-destructive">
              {errors.lineItems.root.message}
            </p>
          )}

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT (20%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Valid Until */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="validUntil">Valid Until</Label>
            <Input
              id="validUntil"
              type="date"
              {...register("validUntil")}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Any additional notes for the customer..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update Quote" : "Create Quote"}
        </Button>
      </div>
    </form>
  );
}
