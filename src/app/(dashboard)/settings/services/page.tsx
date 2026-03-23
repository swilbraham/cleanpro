"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema, type ServiceFormData } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/formatters";
import { Plus, Pencil, Trash2, X, Check, Loader2, Wrench } from "lucide-react";

const CATEGORIES = [
  "Carpet Cleaning",
  "Upholstery Cleaning",
  "Stain Removal",
  "Add-on",
  "Other",
];

const UNITS = ["per room", "per sqft", "per item", "per hour", "flat rate"];

interface Service {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  unit: string;
  category: string;
  isActive: boolean;
}

export default function ServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      unitPrice: 0,
      unit: "per room",
      category: "Carpet Cleaning",
      isActive: true,
    },
  });

  const editForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
  });

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch("/api/services?active=false");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setServices(data.services);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleAdd = async (data: ServiceFormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create service");
      }
      toast(`${data.name} has been added.`);
      addForm.reset();
      setShowAddForm(false);
      fetchServices();
    } catch (error: any) {
      toast(error.message || "Failed to create service", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    editForm.reset({
      name: service.name,
      description: service.description || "",
      unitPrice: service.unitPrice,
      unit: service.unit,
      category: service.category,
      isActive: service.isActive,
    });
  };

  const handleEdit = async (data: ServiceFormData) => {
    if (!editingId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/services/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update service");
      }
      toast(`${data.name} has been updated.`);
      setEditingId(null);
      fetchServices();
    } catch (error: any) {
      toast(error.message || "Failed to update service", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (service: Service) => {
    if (!confirm(`Delete "${service.name}"? If this service is used in existing quotes or jobs, it will be deactivated instead.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete service");
      }
      const result = await res.json();
      toast(result.message);
      fetchServices();
    } catch (error: any) {
      toast(error.message || "Failed to delete service", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Catalog</h1>
          <p className="text-muted-foreground">
            Manage the services you offer to customers
          </p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        )}
      </div>

      {/* Add Service Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Service</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={addForm.handleSubmit(handleAdd)}
              className="grid grid-cols-6 gap-4 items-end"
            >
              <div className="col-span-2">
                <Label>Name</Label>
                <Input
                  {...addForm.register("name")}
                  placeholder="e.g. Deep Clean"
                />
                {addForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-destructive">
                    {addForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Input
                  {...addForm.register("description")}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...addForm.register("unitPrice", { valueAsNumber: true })}
                />
                {addForm.formState.errors.unitPrice && (
                  <p className="mt-1 text-sm text-destructive">
                    {addForm.formState.errors.unitPrice.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Unit</Label>
                <Select
                  value={addForm.watch("unit")}
                  onChange={(e) => addForm.setValue("unit", e.target.value)}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={addForm.watch("category")}
                  onChange={(e) => addForm.setValue("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="col-span-6 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    addForm.reset();
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Check className="mr-2 h-4 w-4" />
                  Add Service
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Services Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading services...</div>
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wrench className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No services yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your first service to start creating quotes.
              </p>
              {!showAddForm && (
                <Button className="mt-4" onClick={() => setShowAddForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Service
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) =>
                  editingId === service.id ? (
                    <TableRow key={service.id}>
                      <TableCell>
                        <Input
                          {...editForm.register("name")}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          {...editForm.register("description")}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          className="h-8"
                          value={editForm.watch("category")}
                          onChange={(e) =>
                            editForm.setValue("category", e.target.value)
                          }
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          {...editForm.register("unitPrice", {
                            valueAsNumber: true,
                          })}
                          className="h-8 w-24 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          className="h-8"
                          value={editForm.watch("unit")}
                          onChange={(e) =>
                            editForm.setValue("unit", e.target.value)
                          }
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          className="h-8"
                          value={editForm.watch("isActive") ? "active" : "inactive"}
                          onChange={(e) =>
                            editForm.setValue("isActive", e.target.value === "active")
                          }
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={editForm.handleSubmit(handleEdit)}
                            disabled={submitting}
                          >
                            {submitting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {service.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{service.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(service.unitPrice)}
                      </TableCell>
                      <TableCell>{service.unit}</TableCell>
                      <TableCell>
                        <Badge
                          variant={service.isActive ? "default" : "secondary"}
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(service)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(service)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
