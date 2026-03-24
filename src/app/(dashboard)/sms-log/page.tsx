"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/formatters";
import {
  MessageSquare,
  RefreshCw,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Send,
} from "lucide-react";

interface SmsReminder {
  id: string;
  type: string;
  phone: string;
  message: string;
  status: string;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
  job: {
    jobNumber: string;
    scheduledDate: string;
    customer: { firstName: string; lastName: string };
  };
}

export default function SmsLogPage() {
  const [reminders, setReminders] = useState<SmsReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringCron, setTriggeringCron] = useState(false);
  const [resending, setResending] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch("/api/sms");
      const data = await res.json();
      setReminders(data.reminders || []);
    } catch {
      toast("Failed to load SMS log", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleTriggerCron = async () => {
    setTriggeringCron(true);
    try {
      const res = await fetch("/api/cron/sms-reminders/trigger", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(
        `Sent ${data.reminders} reminder(s) and ${data.reviews} review request(s)`
      );
      fetchReminders();
    } catch (error: any) {
      toast(error.message || "Failed to trigger", "error");
    } finally {
      setTriggeringCron(false);
    }
  };

  const handleResend = async (id: string) => {
    setResending(id);
    try {
      const res = await fetch("/api/sms/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast("SMS resent successfully");
      fetchReminders();
    } catch (error: any) {
      toast(error.message || "Failed to resend", "error");
    } finally {
      setResending(null);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "SENT":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "REMINDER_24H_BEFORE":
        return "Reminder";
      case "REVIEW_24H_AFTER":
        return "Review";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-7 w-7" />
            SMS Log
          </h1>
          <p className="text-muted-foreground text-sm">
            Automated reminders and review requests
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReminders}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleTriggerCron}
            disabled={triggeringCron}
          >
            <Send className="h-4 w-4 mr-1" />
            {triggeringCron ? "Sending..." : "Send Now"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xs text-muted-foreground">Total Sent</div>
            <div className="text-xl font-bold text-green-600">
              {reminders.filter((r) => r.status === "SENT").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xs text-muted-foreground">Failed</div>
            <div className="text-xl font-bold text-red-600">
              {reminders.filter((r) => r.status === "FAILED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="text-xl font-bold text-yellow-600">
              {reminders.filter((r) => r.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SMS Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Message History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : reminders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No SMS messages sent yet</p>
              <p className="text-xs mt-1">
                Messages are sent automatically at 8am daily
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Job
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Phone
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.map((sms) => (
                    <TableRow key={sms.id}>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {statusIcon(sms.status)}
                          <Badge
                            variant={
                              sms.status === "SENT"
                                ? "success"
                                : sms.status === "FAILED"
                                ? "destructive"
                                : "warning"
                            }
                            className="text-[10px]"
                          >
                            {sms.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-[10px]">
                          {typeLabel(sms.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {sms.job.customer.firstName} {sms.job.customer.lastName}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {sms.job.jobNumber}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {sms.phone}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sms.sentAt
                          ? formatDate(sms.sentAt)
                          : formatDate(sms.createdAt)}
                      </TableCell>
                      <TableCell>
                        {sms.status === "FAILED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResend(sms.id)}
                            disabled={resending === sms.id}
                            title={sms.error || "Resend"}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
