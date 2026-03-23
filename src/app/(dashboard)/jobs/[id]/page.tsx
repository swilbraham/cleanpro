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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatTime, formatCurrency } from "@/lib/formatters";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Play,
  CheckCircle,
  FileText,
  User,
  Home,
  ClipboardList,
  Clock,
  ExternalLink,
} from "lucide-react";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  service: { id: string; name: string; unit: string };
}

interface Job {
  id: string;
  jobNumber: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string | null;
  duration: number;
  notes: string | null;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
    address: string;
    city: string;
    postcode: string;
  };
  property: {
    id: string;
    address: string;
    city: string;
    postcode: string;
    propertyType: string | null;
    rooms: number | null;
    sqFootage: number | null;
    carpetTypes: string[];
    accessNotes: string | null;
  } | null;
  quote: {
    id: string;
    quoteNumber: string;
    total: number;
  } | null;
  assignedTo: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    color: string | null;
  } | null;
  lineItems: LineItem[];
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    total: number;
    amountPaid: number;
  } | null;
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setJob(data);
    } catch {
      toast("Job not found", "error");
      router.push("/jobs");
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      toast(`Job marked as ${newStatus.replace("_", " ").toLowerCase()}`);
      fetchJob();
    } catch (error: any) {
      toast(error.message || "Failed to update status", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!confirm("Generate an invoice for this job?")) return;
    setGeneratingInvoice(true);
    try {
      const res = await fetch(`/api/jobs/${id}/invoice`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate invoice");
      }
      const invoice = await res.json();
      toast(`Invoice ${invoice.invoiceNumber} generated`);
      fetchJob();
    } catch (error: any) {
      toast(error.message || "Failed to generate invoice", "error");
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this job? This cannot be undone."
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete job");
      }
      toast("Job deleted");
      router.push("/jobs");
    } catch (error: any) {
      toast(error.message || "Failed to delete job", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading job...</div>
      </div>
    );
  }

  if (!job) return null;

  const subtotal = job.lineItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/jobs">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {job.jobNumber}
              </h1>
              <JobStatusBadge status={job.status} />
            </div>
            <p className="text-muted-foreground">
              Created {formatDate(job.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Status Progression Buttons */}
          {job.status === "SCHEDULED" && (
            <Button
              onClick={() => handleStatusChange("IN_PROGRESS")}
              disabled={updating}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Job
            </Button>
          )}
          {job.status === "IN_PROGRESS" && (
            <Button
              onClick={() => handleStatusChange("COMPLETED")}
              disabled={updating}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Job
            </Button>
          )}
          {job.status === "COMPLETED" && !job.invoice && (
            <Button
              onClick={handleGenerateInvoice}
              disabled={generatingInvoice}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
          )}
          {job.status === "INVOICED" && job.invoice && (
            <Link href={`/invoices/${job.invoice.id}`}>
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Invoice {job.invoice.invoiceNumber}
              </Button>
            </Link>
          )}

          {job.status !== "INVOICED" && job.status !== "CANCELLED" && (
            <Link href={`/jobs/${id}/edit`}>
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          {!job.invoice && (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Cancel button for scheduled/in-progress */}
      {(job.status === "SCHEDULED" || job.status === "IN_PROGRESS") && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleStatusChange("CANCELLED")}
            disabled={updating}
          >
            Cancel Job
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Schedule Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {formatDate(job.scheduledDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {job.scheduledTime
                      ? formatTime(job.scheduledTime)
                      : "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{job.duration} minutes</p>
                </div>
              </div>
              {job.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {job.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Line Items
              </CardTitle>
              <CardDescription>
                {job.lineItems.length} item
                {job.lineItems.length !== 1 && "s"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {job.lineItems.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No line items added.
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">
                          Unit Price
                        </TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {job.lineItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.service.name}
                          </TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex justify-end border-t pt-4">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          VAT (20%)
                        </span>
                        <span>{formatCurrency(subtotal * 0.2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total</span>
                        <span>{formatCurrency(subtotal * 1.2)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Property Info */}
          {job.property && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Property
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">{job.property.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.property.city}, {job.property.postcode}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {job.property.propertyType && (
                      <span>Type: {job.property.propertyType}</span>
                    )}
                    {job.property.rooms && (
                      <span>{job.property.rooms} rooms</span>
                    )}
                    {job.property.sqFootage && (
                      <span>{job.property.sqFootage} sq ft</span>
                    )}
                  </div>
                  {job.property.carpetTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {job.property.carpetTypes.map((type) => (
                        <Badge
                          key={type}
                          variant="secondary"
                          className="text-xs"
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {job.property.accessNotes && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Access Notes
                      </p>
                      <p className="text-sm">{job.property.accessNotes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Link
                  href={`/customers/${job.customer.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {job.customer.firstName} {job.customer.lastName}
                </Link>
              </div>
              <div className="text-sm space-y-1">
                <p>{job.customer.phone}</p>
                {job.customer.email && (
                  <p className="text-muted-foreground">
                    {job.customer.email}
                  </p>
                )}
                <p className="text-muted-foreground">
                  {job.customer.address}, {job.customer.city},{" "}
                  {job.customer.postcode}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Team Member */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned To</CardTitle>
            </CardHeader>
            <CardContent>
              {job.assignedTo ? (
                <div className="flex items-center gap-3">
                  {job.assignedTo.color && (
                    <span
                      className="inline-block h-8 w-8 rounded-full"
                      style={{ backgroundColor: job.assignedTo.color }}
                    />
                  )}
                  <div>
                    <p className="font-medium">{job.assignedTo.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.assignedTo.email}
                    </p>
                    {job.assignedTo.phone && (
                      <p className="text-sm text-muted-foreground">
                        {job.assignedTo.phone}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unassigned</p>
              )}
            </CardContent>
          </Card>

          {/* Linked Quote */}
          {job.quote && (
            <Card>
              <CardHeader>
                <CardTitle>Linked Quote</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/quotes/${job.quote.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50"
                >
                  <span className="font-medium">{job.quote.quoteNumber}</span>
                  <span className="text-sm">
                    {formatCurrency(job.quote.total)}
                  </span>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Invoice */}
          {job.invoice && (
            <Card>
              <CardHeader>
                <CardTitle>Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/invoices/${job.invoice.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">
                      {job.invoice.invoiceNumber}
                    </p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {job.invoice.status}
                    </Badge>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">
                      {formatCurrency(job.invoice.total)}
                    </p>
                    <p className="text-muted-foreground">
                      Paid: {formatCurrency(job.invoice.amountPaid)}
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
