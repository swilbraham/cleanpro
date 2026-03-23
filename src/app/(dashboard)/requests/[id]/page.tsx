"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatDateTime } from "@/lib/formatters";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  MessageSquare,
  UserPlus,
  CheckCircle,
  XCircle,
  Send,
  FileText,
} from "lucide-react";

interface RequestDetail {
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
  status: string;
  priority: string;
  notes: string | null;
  customerId: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
    address: string;
    city: string;
    postcode: string;
  } | null;
  assignedTo: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    color: string | null;
  } | null;
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  HIGH: { label: "High", className: "bg-red-100 text-red-800" },
  MEDIUM: { label: "Medium", className: "bg-yellow-100 text-yellow-800" },
  LOW: { label: "Low", className: "bg-gray-100 text-gray-800" },
};

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  PHONE: "Phone",
  EMAIL: "Email",
  REFERRAL: "Referral",
  OTHER: "Other",
};

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);

  const fetchRequest = useCallback(async () => {
    try {
      const res = await fetch(`/api/requests/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setRequest(data);
    } catch {
      toast("Request not found", "error");
      router.push("/requests");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      toast(`Request marked as ${newStatus.toLowerCase()}`);
      fetchRequest();
    } catch (error: any) {
      toast(error.message || "Failed to update status", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this request? This cannot be undone."
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete request");
      }
      toast("Request deleted");
      router.push("/requests");
    } catch (error: any) {
      toast(error.message || "Failed to delete request", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleConvertToCustomer = async () => {
    if (!request) return;
    if (request.customerId) {
      toast("This request is already linked to a customer", "error");
      return;
    }
    setConverting(true);
    try {
      // Create a new customer from the request data
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: request.firstName,
          lastName: request.lastName,
          email: request.email || "",
          phone: request.phone,
          address: request.address || "",
          city: request.city || "",
          postcode: request.postcode || "",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create customer");
      }

      const customer = await res.json();

      // Link the customer to this request and mark as WON
      const updateRes = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id, status: "WON" }),
      });

      if (!updateRes.ok) {
        throw new Error("Failed to link customer to request");
      }

      toast("Customer created and linked to request");
      fetchRequest();
    } catch (error: any) {
      toast(error.message || "Failed to convert to customer", "error");
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading request...</div>
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/requests">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {request.firstName} {request.lastName}
              </h1>
              <RequestStatusBadge status={request.status} />
              <Badge
                variant="secondary"
                className={
                  PRIORITY_CONFIG[request.priority]?.className || ""
                }
              >
                {PRIORITY_CONFIG[request.priority]?.label || request.priority}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {SOURCE_LABELS[request.source] || request.source} request
              {" -- "}
              Created {formatDate(request.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Status Progression Buttons */}
          {request.status === "NEW" && (
            <Button
              onClick={() => handleStatusChange("CONTACTED")}
              disabled={updating}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              <Send className="mr-2 h-4 w-4" />
              Mark Contacted
            </Button>
          )}
          {request.status === "CONTACTED" && (
            <Button
              onClick={() => handleStatusChange("QUOTED")}
              disabled={updating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              Mark Quoted
            </Button>
          )}
          {(request.status === "QUOTED" || request.status === "CONTACTED") && (
            <>
              <Button
                onClick={() => handleStatusChange("WON")}
                disabled={updating}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Won
              </Button>
              <Button
                onClick={() => handleStatusChange("LOST")}
                disabled={updating}
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Lost
              </Button>
            </>
          )}

          {!request.customerId &&
            request.status !== "LOST" && (
              <Button
                onClick={handleConvertToCustomer}
                disabled={converting}
                variant="outline"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Convert to Customer
              </Button>
            )}

          <Link href={`/requests/${id}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{request.description}</p>
            </CardContent>
          </Card>

          {/* Notes */}
          {request.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{request.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Address */}
          {(request.address || request.city || request.postcode) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {request.address && (
                    <p className="font-medium">{request.address}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {[request.city, request.postcode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{request.phone}</span>
              </div>
              {request.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{request.email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Customer */}
          <Card>
            <CardHeader>
              <CardTitle>Linked Customer</CardTitle>
            </CardHeader>
            <CardContent>
              {request.customer ? (
                <Link
                  href={`/customers/${request.customer.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">
                      {request.customer.firstName} {request.customer.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.customer.phone}
                    </p>
                  </div>
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No linked customer yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Assigned To */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned To</CardTitle>
            </CardHeader>
            <CardContent>
              {request.assignedTo ? (
                <div className="flex items-center gap-3">
                  {request.assignedTo.color && (
                    <span
                      className="inline-block h-8 w-8 rounded-full"
                      style={{ backgroundColor: request.assignedTo.color }}
                    />
                  )}
                  <div>
                    <p className="font-medium">{request.assignedTo.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.assignedTo.email}
                    </p>
                    {request.assignedTo.phone && (
                      <p className="text-sm text-muted-foreground">
                        {request.assignedTo.phone}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unassigned</p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDateTime(request.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDateTime(request.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
