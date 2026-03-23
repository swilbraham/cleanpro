"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestSchema, type RequestFormData } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

interface RequestFormProps {
  initialData?: {
    id: string;
    source: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
    address: string | null;
    city: string | null;
    postcode: string | null;
    description: string;
    priority: string;
    notes: string | null;
  };
}

export function RequestForm({ initialData }: RequestFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      source: (initialData?.source as RequestFormData["source"]) || "PHONE",
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      postcode: initialData?.postcode || "",
      description: initialData?.description || "",
      priority:
        (initialData?.priority as RequestFormData["priority"]) || "MEDIUM",
      notes: initialData?.notes || "",
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    setSubmitting(true);
    try {
      const url = initialData
        ? `/api/requests/${initialData.id}`
        : "/api/requests";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save request");
      }

      const result = await res.json();
      toast(
        `Request ${initialData ? "updated" : "created"} successfully.`
      );
      router.push(`/requests/${result.id}`);
    } catch (error: any) {
      toast(error.message || "Failed to save request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="source">Source</Label>
              <Select id="source" {...register("source")}>
                <option value="PHONE">Phone</option>
                <option value="EMAIL">Email</option>
                <option value="WEBSITE">Website</option>
                <option value="REFERRAL">Referral</option>
                <option value="OTHER">Other</option>
              </Select>
              {errors.source && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.source.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select id="priority" {...register("priority")}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>
              {errors.priority && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.priority.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...register("firstName")}
                placeholder="First name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...register("lastName")}
                placeholder="Last name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="Phone number"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="Street address"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} placeholder="City" />
            </div>
            <div>
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                {...register("postcode")}
                placeholder="Postcode"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description & Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe the cleaning request..."
              rows={4}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Any internal notes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update Request" : "Create Request"}
        </Button>
      </div>
    </form>
  );
}
