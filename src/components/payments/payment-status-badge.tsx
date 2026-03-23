import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
  }
> = {
  // Invoice statuses
  UNPAID: { label: "Unpaid", variant: "warning" },
  PARTIAL: { label: "Partial", variant: "info" },
  PAID: { label: "Paid", variant: "success" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
  VOID: { label: "Void", variant: "secondary" },
  // Payment statuses
  PENDING: { label: "Pending", variant: "warning" },
  SUCCEEDED: { label: "Succeeded", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "secondary" },
};

interface PaymentStatusBadgeProps {
  status: string;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
