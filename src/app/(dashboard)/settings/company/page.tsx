"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Building2, Loader2, Save } from "lucide-react";

interface CompanySettingsForm {
  companyName: string;
  address: string;
  city: string;
  postcode: string;
  phone: string;
  email: string;
  website: string;
  vatNumber: string;
  defaultTaxRate: number;
  invoicePrefix: string;
  quotePrefix: string;
  jobPrefix: string;
  invoiceTerms: string;
  quoteTerms: string;
}

export default function CompanySettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanySettingsForm>({
    defaultValues: {
      companyName: "",
      address: "",
      city: "",
      postcode: "",
      phone: "",
      email: "",
      website: "",
      vatNumber: "",
      defaultTaxRate: 20,
      invoicePrefix: "INV",
      quotePrefix: "QUO",
      jobPrefix: "JOB",
      invoiceTerms: "",
      quoteTerms: "",
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings/company");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        reset({
          companyName: data.companyName || "",
          address: data.address || "",
          city: data.city || "",
          postcode: data.postcode || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          vatNumber: data.vatNumber || "",
          defaultTaxRate: data.defaultTaxRate ?? 20,
          invoicePrefix: data.invoicePrefix || "INV",
          quotePrefix: data.quotePrefix || "QUO",
          jobPrefix: data.jobPrefix || "JOB",
          invoiceTerms: data.invoiceTerms || "",
          quoteTerms: data.quoteTerms || "",
        });
      } catch (error) {
        console.error("Failed to fetch company settings:", error);
        toast("Failed to load company settings", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [reset, toast]);

  const onSubmit = async (data: CompanySettingsForm) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      const updated = await res.json();
      reset({
        companyName: updated.companyName || "",
        address: updated.address || "",
        city: updated.city || "",
        postcode: updated.postcode || "",
        phone: updated.phone || "",
        email: updated.email || "",
        website: updated.website || "",
        vatNumber: updated.vatNumber || "",
        defaultTaxRate: updated.defaultTaxRate ?? 20,
        invoicePrefix: updated.invoicePrefix || "INV",
        quotePrefix: updated.quotePrefix || "QUO",
        jobPrefix: updated.jobPrefix || "JOB",
        invoiceTerms: updated.invoiceTerms || "",
        quoteTerms: updated.quoteTerms || "",
      });
      toast("Company settings saved successfully");
    } catch (error: any) {
      toast(error.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Details</h1>
        <p className="text-muted-foreground">
          Update your business information and branding
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  {...register("companyName", {
                    required: "Company name is required",
                  })}
                  placeholder="Your Company Name"
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.companyName.message}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  {...register("address")}
                  placeholder="Street address"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  {...register("postcode")}
                  placeholder="Postcode"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="business@example.com"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...register("website")}
                  placeholder="https://www.example.com"
                />
              </div>
              <div>
                <Label htmlFor="vatNumber">VAT Number</Label>
                <Input
                  id="vatNumber"
                  {...register("vatNumber")}
                  placeholder="GB123456789"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Numbering & Tax */}
        <Card>
          <CardHeader>
            <CardTitle>Numbering &amp; Tax</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                <Input
                  id="defaultTaxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register("defaultTaxRate", { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input
                  id="invoicePrefix"
                  {...register("invoicePrefix")}
                  placeholder="INV"
                />
              </div>
              <div>
                <Label htmlFor="quotePrefix">Quote Prefix</Label>
                <Input
                  id="quotePrefix"
                  {...register("quotePrefix")}
                  placeholder="QUO"
                />
              </div>
              <div>
                <Label htmlFor="jobPrefix">Job Prefix</Label>
                <Input
                  id="jobPrefix"
                  {...register("jobPrefix")}
                  placeholder="JOB"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Default Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Default Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="invoiceTerms">Invoice Terms</Label>
              <Textarea
                id="invoiceTerms"
                {...register("invoiceTerms")}
                placeholder="Payment terms that appear on invoices..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="quoteTerms">Quote Terms</Label>
              <Textarea
                id="quoteTerms"
                {...register("quoteTerms")}
                placeholder="Terms and conditions that appear on quotes..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !isDirty} size="lg">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
