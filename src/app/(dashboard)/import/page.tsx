"use client";

import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface ParsedRow {
  row: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postcode: string;
  date: string | null;
  dateRaw: string;
  time: string | null;
  timeRaw: string;
  duration: number;
  service: string;
  staff: string;
  notes: string;
  status: string;
  price: number | null;
  valid: boolean;
  errors: string[];
}

interface PreviewData {
  headers: string[];
  total: number;
  valid: number;
  invalid: number;
  rows: ParsedRow[];
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(null);
      setResult(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dateFormat", dateFormat);
      formData.append("mode", "preview");

      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data);
    } catch (error: any) {
      toast(error.message || "Failed to parse CSV", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    if (!confirm(`Import ${preview?.valid || 0} bookings? This will create customers and jobs.`)) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dateFormat", dateFormat);
      formData.append("mode", "import");

      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      toast(`Successfully imported ${data.created} bookings`);
    } catch (error: any) {
      toast(error.message || "Import failed", "error");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Upload className="h-7 w-7" />
          Import Bookings
        </h1>
        <p className="text-muted-foreground text-sm">
          Import bookings from Setmore or other systems via CSV
        </p>
      </div>

      {/* Step 1: Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white font-bold">1</span>
            Upload CSV File
          </CardTitle>
          <CardDescription>
            Export your bookings from Setmore (Bookings → Export) and upload the CSV file here
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
            {file ? (
              <div className="text-center">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB — Click to change
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="font-medium">Click to upload CSV file</p>
                <p className="text-sm text-muted-foreground">
                  Supports Setmore, Calendly, and generic CSV exports
                </p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date Format in CSV</label>
              <Select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
              >
                <option value="dd/mm/yyyy">DD/MM/YYYY (UK)</option>
                <option value="mm/dd/yyyy">MM/DD/YYYY (US)</option>
                <option value="yyyy-mm-dd">YYYY-MM-DD (ISO)</option>
              </Select>
            </div>
            <Button
              onClick={handlePreview}
              disabled={!file || loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Preview Import
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Preview */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white font-bold">2</span>
              Review Data
            </CardTitle>
            <CardDescription>
              Check the parsed data below before importing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className="text-2xl font-bold">{preview.total}</div>
                <div className="text-xs text-muted-foreground">Total Rows</div>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{preview.valid}</div>
                <div className="text-xs text-green-600">Ready to Import</div>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{preview.invalid}</div>
                <div className="text-xs text-red-600">Issues Found</div>
              </div>
            </div>

            {/* Detected columns */}
            <div>
              <p className="text-sm font-medium mb-2">Detected Columns:</p>
              <div className="flex flex-wrap gap-1">
                {preview.headers.map((h) => (
                  <Badge key={h} variant="secondary" className="text-xs">
                    {h}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden sm:table-cell">Address</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Time</TableHead>
                    <TableHead className="hidden md:table-cell">Service</TableHead>
                    <TableHead className="hidden md:table-cell">Staff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((row) => (
                    <TableRow
                      key={row.row}
                      className={row.valid ? "" : "bg-red-50/50"}
                    >
                      <TableCell>
                        {row.valid ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="group relative">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <div className="hidden group-hover:block absolute left-6 top-0 z-10 bg-white shadow-lg rounded-md p-2 text-xs text-red-600 min-w-[200px] border">
                              {row.errors.map((e, i) => (
                                <p key={i}>{e}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {row.firstName} {row.lastName}
                      </TableCell>
                      <TableCell className="text-sm">{row.phone}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground truncate max-w-[150px]">
                        {row.postcode || row.city || row.address || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.date
                          ? new Date(row.date).toLocaleDateString("en-GB")
                          : <span className="text-red-500">{row.dateRaw || "Missing"}</span>
                        }
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {row.time || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[120px]">
                        {row.service || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {row.staff || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {preview.invalid > 0 && (
              <div className="flex items-start gap-2 rounded-md bg-yellow-50 p-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">
                    {preview.invalid} row(s) have issues and will be skipped
                  </p>
                  <p className="text-yellow-600 text-xs mt-1">
                    Hover over the red ✕ icons to see what&apos;s wrong. Only valid rows will be imported.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || preview.valid === 0}
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Import {preview.valid} Booking{preview.valid !== 1 ? "s" : ""}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{result.created}</div>
                <div className="text-sm text-green-600">Bookings Imported</div>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <div className="text-3xl font-bold text-muted-foreground">{result.skipped}</div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600">{e}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setResult(null);
                }}
              >
                Import More
              </Button>
              <a href="/jobs">
                <Button>View Jobs</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Export from Setmore</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ol className="list-decimal list-inside space-y-1.5">
            <li>Log in to your Setmore account</li>
            <li>Go to <strong>Settings → Integrations → Data Export</strong></li>
            <li>Select <strong>Appointments</strong> and choose your date range</li>
            <li>Click <strong>Export to CSV</strong></li>
            <li>Upload the downloaded file above</li>
          </ol>
          <p className="pt-2">
            The importer auto-detects Setmore column names. It also works with exports from
            Calendly, Acuity, and generic CSV files with standard column headers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
