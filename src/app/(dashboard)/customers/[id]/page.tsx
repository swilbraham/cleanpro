"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { PropertyForm } from "@/components/customers/property-form";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatCurrency } from "@/lib/formatters";
import type { PropertyFormData } from "@/lib/validators";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Home,
  Briefcase,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Send,
  X,
} from "lucide-react";

interface Property {
  id: string;
  address: string;
  city: string;
  postcode: string;
  propertyType: string | null;
  rooms: number | null;
  sqFootage: number | null;
  carpetTypes: string[];
  accessNotes: string | null;
  createdAt: string;
}

interface Job {
  id: string;
  jobNumber: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string | null;
  duration: number;
  notes: string | null;
  property: { address: string } | null;
  assignedTo: { name: string } | null;
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string };
}

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  amountPaid: number;
  createdAt: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  tags: string[];
  createdAt: string;
  properties: Property[];
  jobs: Job[];
  notes: Note[];
  quotes: Quote[];
  invoices: Invoice[];
}

const JOB_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  INVOICED: "bg-purple-100 text-purple-800",
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomer = useCallback(async () => {
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setCustomer(data);
    } catch {
      toast("Customer not found", "error");
      router.push("/customers");
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleDeleteCustomer = async () => {
    if (!confirm("Are you sure you want to delete this customer? This cannot be undone.")) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast("Customer deleted");
      router.push("/customers");
    } catch {
      toast("Failed to delete customer", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddProperty = async (data: PropertyFormData) => {
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, customerId: id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add property");
      }
      toast("Property added");
      setShowPropertyForm(false);
      fetchCustomer();
    } catch (error: any) {
      toast(error.message || "Failed to add property", "error");
    }
  };

  const handleUpdateProperty = async (propertyId: string, data: PropertyFormData) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update property");
      }
      toast("Property updated");
      setEditingPropertyId(null);
      fetchCustomer();
    } catch (error: any) {
      toast(error.message || "Failed to update property", "error");
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm("Delete this property?")) return;
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast("Property deleted");
      fetchCustomer();
    } catch {
      toast("Failed to delete property", "error");
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/customers/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteText.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      toast("Note added");
      setNoteText("");
      fetchCustomer();
    } catch {
      toast("Failed to add note", "error");
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading customer...</div>
      </div>
    );
  }

  if (!customer) return null;

  const totalRevenue = customer.invoices.reduce(
    (sum, inv) => sum + inv.amountPaid,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-muted-foreground">
              Customer since {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/customers/${id}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={handleDeleteCustomer}
            disabled={deleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{customer.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{customer.email || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">
                  {customer.city}, {customer.postcode}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="font-medium">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      {customer.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customer.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Properties & Jobs */}
        <div className="space-y-6 lg:col-span-2">
          {/* Properties */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Properties
                </CardTitle>
                <CardDescription>
                  {customer.properties.length} propert
                  {customer.properties.length === 1 ? "y" : "ies"} on file
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setShowPropertyForm(!showPropertyForm);
                  setEditingPropertyId(null);
                }}
              >
                {showPropertyForm ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Property
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {showPropertyForm && (
                <div className="rounded-lg border p-4">
                  <h4 className="mb-4 font-semibold">New Property</h4>
                  <PropertyForm
                    onSubmit={handleAddProperty}
                    onCancel={() => setShowPropertyForm(false)}
                    submitLabel="Add Property"
                  />
                </div>
              )}

              {customer.properties.length === 0 && !showPropertyForm ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No properties yet. Add one to get started.
                </p>
              ) : (
                customer.properties.map((property) => (
                  <div key={property.id} className="rounded-lg border p-4">
                    {editingPropertyId === property.id ? (
                      <div>
                        <h4 className="mb-4 font-semibold">Edit Property</h4>
                        <PropertyForm
                          defaultValues={{
                            address: property.address,
                            city: property.city,
                            postcode: property.postcode,
                            propertyType: property.propertyType || "",
                            rooms: property.rooms || undefined,
                            sqFootage: property.sqFootage || undefined,
                            carpetTypes: property.carpetTypes,
                            accessNotes: property.accessNotes || "",
                          }}
                          onSubmit={(data) =>
                            handleUpdateProperty(property.id, data)
                          }
                          onCancel={() => setEditingPropertyId(null)}
                          submitLabel="Update Property"
                        />
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{property.address}</p>
                          <p className="text-sm text-muted-foreground">
                            {property.city}, {property.postcode}
                          </p>
                          <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
                            {property.propertyType && (
                              <span>{property.propertyType}</span>
                            )}
                            {property.rooms && (
                              <span>{property.rooms} rooms</span>
                            )}
                            {property.sqFootage && (
                              <span>{property.sqFootage} sq ft</span>
                            )}
                          </div>
                          {property.carpetTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {property.carpetTypes.map((type) => (
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
                          {property.accessNotes && (
                            <p className="pt-1 text-sm text-muted-foreground">
                              Access: {property.accessNotes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPropertyId(property.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleDeleteProperty(property.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Job History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Job History
              </CardTitle>
              <CardDescription>
                {customer.jobs.length} job{customer.jobs.length !== 1 && "s"}{" "}
                total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer.jobs.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No jobs yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.jobs.map((job) => (
                      <TableRow
                        key={job.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/jobs/${job.id}`)}
                      >
                        <TableCell className="font-medium">
                          {job.jobNumber}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              JOB_STATUS_COLORS[job.status] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {job.status.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(job.scheduledDate)}</TableCell>
                        <TableCell>
                          {job.property?.address || "No property"}
                        </TableCell>
                        <TableCell>
                          {job.assignedTo?.name || "Unassigned"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Notes & Quick Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/quotes/new?customerId=${id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  New Quote
                </Button>
              </Link>
              <Link href={`/jobs/new?customerId=${id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  New Job
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddNote} className="space-y-2">
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!noteText.trim() || submittingNote}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
              </form>

              <div className="space-y-3">
                {customer.notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No notes yet.
                  </p>
                ) : (
                  customer.notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border bg-muted/50 p-3"
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{note.author.name}</span>
                        <span>&middot;</span>
                        <span>{formatDate(note.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Quotes */}
          {customer.quotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Quotes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {customer.quotes.slice(0, 5).map((quote) => (
                    <Link
                      key={quote.id}
                      href={`/quotes/${quote.id}`}
                      className="flex items-center justify-between rounded-md border p-2 hover:bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {quote.quoteNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(quote.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(quote.total)}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {quote.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Invoices */}
          {customer.invoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {customer.invoices.slice(0, 5).map((invoice) => (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between rounded-md border p-2 hover:bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(invoice.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(invoice.total)}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {invoice.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
