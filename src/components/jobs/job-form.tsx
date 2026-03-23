"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobSchema, type JobFormData } from "@/lib/validators";
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
  properties?: Property[];
}

interface Property {
  id: string;
  address: string;
  city: string;
  postcode: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  color: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  unit: string;
  category: string;
}

interface LineItem {
  serviceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface JobFormProps {
  initialData?: {
    id: string;
    customerId: string;
    customer: Customer;
    propertyId: string | null;
    assignedToId: string | null;
    scheduledDate: string;
    scheduledTime: string | null;
    duration: number;
    notes: string | null;
    lineItems: LineItem[];
  };
}

export function JobForm({ initialData }: JobFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

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
  } = useForm<JobFormData & { lineItems?: LineItem[] }>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      customerId: initialData?.customerId || "",
      propertyId: initialData?.propertyId || "",
      assignedToId: initialData?.assignedToId || "",
      scheduledDate: initialData?.scheduledDate
        ? new Date(initialData.scheduledDate).toISOString().split("T")[0]
        : "",
      scheduledTime: initialData?.scheduledTime || "",
      duration: initialData?.duration || 60,
      notes: initialData?.notes || "",
    },
  });

  // Separate line items state (not part of job schema validation)
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialData?.lineItems || [
      { serviceId: "", description: "", quantity: 1, unitPrice: 0 },
    ]
  );

  // Fetch services and team members on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [servicesRes, teamRes] = await Promise.all([
          fetch("/api/services?active=true"),
          fetch("/api/team"),
        ]);
        if (servicesRes.ok) {
          const data = await servicesRes.json();
          setServices(data.services);
        }
        if (teamRes.ok) {
          const data = await teamRes.json();
          setTeamMembers(Array.isArray(data) ? data : data.members || []);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    }
    loadData();
  }, []);

  // Load properties when customer changes
  useEffect(() => {
    async function loadProperties() {
      if (!selectedCustomer) {
        setProperties([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/customers/${selectedCustomer.id}/properties`
        );
        if (res.ok) {
          const data = await res.json();
          setProperties(data);
        }
      } catch {
        setProperties([]);
      }
    }
    loadProperties();
  }, [selectedCustomer]);

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
    setValue("propertyId", "");
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  // Line item helpers
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { serviceId: "", description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = value;
    setLineItems(updated);
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      const updated = [...lineItems];
      updated[index] = {
        serviceId,
        description: service.description || service.name,
        quantity: updated[index].quantity || 1,
        unitPrice: service.unitPrice,
      };
      setLineItems(updated);
    }
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);
  const taxAmount = subtotal * 0.2;
  const total = subtotal + taxAmount;

  const onSubmit = async (data: JobFormData) => {
    setSubmitting(true);
    try {
      // Filter out empty line items
      const validLineItems = lineItems.filter(
        (item) => item.serviceId && item.description
      );

      const payload = {
        ...data,
        propertyId: data.propertyId || null,
        assignedToId: data.assignedToId || null,
        duration: data.duration || 60,
        lineItems: validLineItems,
      };

      const url = initialData
        ? `/api/jobs/${initialData.id}`
        : "/api/jobs";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save job");
      }

      const job = await res.json();
      toast(
        `Job ${job.jobNumber || ""} has been ${initialData ? "updated" : "created"}.`
      );
      router.push(`/jobs/${job.id}`);
    } catch (error: any) {
      toast(error.message || "Failed to save job", "error");
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
                  setValue("propertyId", "");
                  setProperties([]);
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

      {/* Schedule & Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="scheduledDate">Date *</Label>
              <Input
                id="scheduledDate"
                type="date"
                {...register("scheduledDate")}
              />
              {errors.scheduledDate && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.scheduledDate.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="scheduledTime">Time</Label>
              <Input
                id="scheduledTime"
                type="time"
                {...register("scheduledTime")}
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (mins)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                step="15"
                {...register("duration", {
                  setValueAs: (v) =>
                    v === "" || v === undefined ? undefined : Number(v),
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Property */}
            <div>
              <Label htmlFor="propertyId">Property</Label>
              <Select id="propertyId" {...register("propertyId")}>
                <option value="">No property selected</option>
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.address}, {prop.city}, {prop.postcode}
                  </option>
                ))}
              </Select>
              {!selectedCustomer && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Select a customer first to see their properties
                </p>
              )}
            </div>

            {/* Assigned To */}
            <div>
              <Label htmlFor="assignedToId">Assign To</Label>
              <Select id="assignedToId" {...register("assignedToId")}>
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Any additional notes about the job..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineItems.map((item, index) => {
            const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
            return (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-md border p-3 md:grid md:grid-cols-12 md:items-end md:p-4"
              >
                <div className="md:col-span-3">
                  <Label>Service</Label>
                  <Select
                    value={item.serviceId}
                    onChange={(e) => handleServiceChange(index, e.target.value)}
                  >
                    <option value="">Select service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({formatCurrency(service.unitPrice)}/
                        {service.unit})
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="md:col-span-3">
                  <Label>Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(index, "description", e.target.value)
                    }
                    placeholder="Description"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateLineItem(
                        index,
                        "quantity",
                        parseInt(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateLineItem(
                        index,
                        "unitPrice",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between md:col-span-2 md:contents">
                  <div className="md:col-span-1 md:text-right">
                    <Label>Total</Label>
                    <p className="py-2 font-medium">{formatCurrency(lineTotal)}</p>
                  </div>

                  <div className="md:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length <= 1}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

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

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update Job" : "Create Job"}
        </Button>
      </div>
    </form>
  );
}
